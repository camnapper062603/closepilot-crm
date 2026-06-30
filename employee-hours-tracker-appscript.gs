/**
 * Employee Hours Tracker - Complete Google Apps Script backend.
 *
 * Apps Script file setup:
 * 1. Put this entire file in Code.gs.
 * 2. Create a separate HTML file named EmployeePortal.
 * 3. Put the contents of EmployeePortal.html in that HTML file.
 * 4. Run setupHoursTracker().
 * 5. Deploy as a Web App.
 *
 * The Google Sheet is the private master schedule. Employees use the web app
 * portal to load, save, and clock time for rows tied to their email address.
 */

const HOURS_TRACKER = {
  sheets: {
    settings: "Settings",
    employees: "Employees",
    schedule: "Employee Schedule",
    timeClock: "Time Clock",
    timesheets: "Timesheets",
    summary: "Summary",
    errorLog: "Error Log",
  },
  headers: {
    settings: ["Setting", "Value", "Notes"],
    employees: ["Employee Name", "Employee Email"],
    schedule: [
      "Employee Name",
      "Employee Email",
      "Date",
      "Start Time",
      "End Time",
      "Break Minutes",
      "Role/Job",
      "Notes",
      "Scheduled Hours",
      "Last Updated",
    ],
    timeClock: ["Entry ID", "Timestamp", "Employee Name", "Employee Email", "Action", "Work Date", "Clock Time", "Notes"],
    timesheets: [
      "Employee Name",
      "Employee Email",
      "Date",
      "Clock In",
      "Clock Out",
      "Break Minutes",
      "Worked Hours",
      "Scheduled Hours",
      "Variance",
      "Scheduled Shifts",
      "Status",
    ],
    summary: [
      "Employee Name",
      "Employee Email",
      "Scheduled Hours",
      "Worked Hours",
      "Variance",
      "Open Punches",
      "Scheduled Shifts",
      "Pay Period",
    ],
    errorLog: ["Timestamp", "Action", "Message", "Stack"],
  },
  punchActions: ["Clock In", "Clock Out"],
  timesheetStatuses: ["Complete", "No Clock In", "No Clock Out"],
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Hours Tracker")
    .addItem("Setup or refresh workbook", "setupHoursTracker")
    .addSeparator()
    .addItem("Register/update my name and email", "registerOrUpdateEmployee")
    .addItem("Fill selected rows with my name/email", "fillSelectedScheduleIdentity")
    .addItem("Save/update schedule rows", "saveEmployeeSchedule")
    .addSeparator()
    .addItem("Clock in", "clockIn")
    .addItem("Clock out", "clockOut")
    .addSeparator()
    .addItem("Refresh timesheets and summary", "refreshTimesheets")
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile("EmployeePortal")
    .setTitle("Employee Schedule Portal")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doget() {
  return doGet();
}

function setupHoursTracker() {
  return runSafely_("Setup or refresh workbook", setupHoursTracker_);
}

function registerOrUpdateEmployee() {
  return runSafely_("Register/update my name and email", registerOrUpdateEmployee_);
}

function fillSelectedScheduleIdentity() {
  return runSafely_("Fill selected rows with my name/email", fillSelectedScheduleIdentity_);
}

function saveEmployeeSchedule() {
  return runSafely_("Save/update schedule rows", saveEmployeeSchedule_);
}

function submitMySchedule() {
  return saveEmployeeSchedule();
}

function clockIn() {
  return runSafely_("Clock in", function () {
    addClockEntry_("Clock In");
  });
}

function clockOut() {
  return runSafely_("Clock out", function () {
    addClockEntry_("Clock Out");
  });
}

function refreshTimesheets(showAlert) {
  return runSafely_("Refresh timesheets and summary", function () {
    refreshTimesheets_(showAlert);
  });
}

function getPortalBootstrap() {
  return runPortalSafely_("Portal bootstrap", function () {
    const settings = getSettings_();
    const emailGuess = cleanEmail_(Session.getActiveUser().getEmail());
    const existingEmployee = emailGuess ? findEmployeeByEmail_(emailGuess) : null;

    return {
      emailGuess: emailGuess,
      nameGuess: existingEmployee ? existingEmployee.name : "",
      today: formatDateForInput_(new Date()),
      payPeriod: {
        start: formatSettingDate_(settings["Pay Period Start"]),
        end: formatSettingDate_(settings["Pay Period End"]),
      },
    };
  });
}

function getPortalData(identity) {
  return runPortalSafely_("Portal load schedule", function () {
    const employee = normalizePortalIdentity_(identity, false);
    const existingEmployee = findEmployeeByEmail_(employee.email);
    const name = employee.name || (existingEmployee && existingEmployee.name) || "";

    return {
      employee: {
        name: name,
        email: employee.email,
      },
      schedule: getScheduleForEmail_(employee.email),
      timesheets: getTimesheetsForEmail_(employee.email),
    };
  });
}

function savePortalSchedule(payload) {
  return runPortalSafely_("Portal save schedule", function () {
    const employee = normalizePortalIdentity_(payload, true);
    const shifts = (payload && payload.shifts ? payload.shifts : [])
      .map(function (shift, index) {
        return normalizePortalShift_(shift, index + 1);
      })
      .filter(Boolean);
    const now = new Date();
    const lock = LockService.getDocumentLock();

    lock.waitLock(30000);
    try {
      deleteScheduleRowsForEmail_(employee.email);
      if (shifts.length) {
        appendRows_(
          ss_().getSheetByName(HOURS_TRACKER.sheets.schedule),
          shifts.map(function (shift) {
            return [
              employee.name,
              employee.email,
              shift.date,
              shift.startTime,
              shift.endTime,
              shift.breakMinutes,
              shift.roleJob,
              shift.notes,
              shift.scheduledHours,
              now,
            ];
          }),
        );
      }
      upsertEmployee_(employee);
      sortSchedule_();
      refreshTimesheets_(false);
    } finally {
      lock.releaseLock();
    }

    return getPortalData(employee);
  });
}

function portalClockIn(identity) {
  return clockPortal_("Clock In", identity);
}

function portalClockOut(identity) {
  return clockPortal_("Clock Out", identity);
}

function setupHoursTracker_() {
  const ss = ss_();

  Object.keys(HOURS_TRACKER.sheets).forEach(function (key) {
    const sheet = ensureSheet_(ss, HOURS_TRACKER.sheets[key]);
    setHeader_(sheet, HOURS_TRACKER.headers[key]);
  });

  seedSettings_();
  formatWorkbook_();
  applyValidations_();
  SpreadsheetApp.getUi().alert("Hours Tracker is ready. Deploy the web app and share the portal URL with employees.");
}

function registerOrUpdateEmployee_() {
  const employee = promptEmployeeIdentity_();
  upsertEmployee_(employee);
  SpreadsheetApp.getUi().alert("Saved " + employee.name + " (" + employee.email + ") to Employees.");
}

function fillSelectedScheduleIdentity_() {
  const ss = ss_();
  const sheet = ss.getActiveSheet();
  const selection = sheet.getActiveRange();

  if (sheet.getName() !== HOURS_TRACKER.sheets.schedule || !selection) {
    SpreadsheetApp.getUi().alert("Select one or more rows on the Employee Schedule tab first.");
    return;
  }

  const employee = promptEmployeeIdentity_();
  const startRow = Math.max(selection.getRow(), 2);
  const rowCount = selection.getLastRow() - startRow + 1;
  if (rowCount < 1) {
    SpreadsheetApp.getUi().alert("Select schedule rows below the header.");
    return;
  }

  const values = Array.from({ length: rowCount }, function () {
    return [employee.name, employee.email];
  });
  sheet.getRange(startRow, 1, rowCount, 2).setValues(values);
  upsertEmployee_(employee);
  SpreadsheetApp.getUi().alert("Filled " + rowCount + " row(s) with " + employee.name + " (" + employee.email + ").");
}

function saveEmployeeSchedule_() {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  const rows = getBodyRows_(sheet);
  const now = new Date();
  let updated = 0;

  rows.forEach(function (item) {
    const row = item.row;
    const name = cleanName_(row[0]);
    const email = cleanEmail_(row[1]);
    const date = row[2];
    const start = row[3];
    const end = row[4];

    if (!name && !email && !date && !start && !end) return;
    if (!name || !email || !date || !start || !end) {
      throw new Error("Row " + item.index + " needs Employee Name, Employee Email, Date, Start Time, and End Time.");
    }

    const breakMinutes = Number(row[5] || 0);
    const scheduledHours = calculateHours_(date, start, end, breakMinutes);

    sheet.getRange(item.index, 1, 1, HOURS_TRACKER.headers.schedule.length).setValues([
      [
        name,
        email,
        normalizeDate_(date),
        normalizeTime_(start),
        normalizeTime_(end),
        breakMinutes,
        row[6] || "",
        row[7] || "",
        scheduledHours,
        now,
      ],
    ]);

    upsertEmployee_({ name: name, email: email });
    updated += 1;
  });

  sortSchedule_();
  refreshTimesheets_(false);
  SpreadsheetApp.getUi().alert(updated + " schedule row(s) saved or updated.");
}

function refreshTimesheets_(showAlert) {
  const shouldAlert = showAlert !== false;
  const scheduleSheet = ss_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  const clockSheet = ss_().getSheetByName(HOURS_TRACKER.sheets.timeClock);
  const timesheetSheet = ss_().getSheetByName(HOURS_TRACKER.sheets.timesheets);
  const scheduleRows = getBodyRows_(scheduleSheet).map(function (item) {
    return item.row;
  });
  const punchRows = getBodyRows_(clockSheet).map(function (item) {
    return item.row;
  });
  const groups = {};

  scheduleRows.forEach(function (row) {
    const name = cleanName_(row[0]);
    const email = cleanEmail_(row[1]);
    const date = row[2];
    if (!name || !email || !date) return;

    const key = groupKey_(email, date);
    if (!groups[key]) groups[key] = makeGroup_(name, email, date);
    groups[key].name = name;
    groups[key].scheduledHours += Number(row[8] || calculateHours_(date, row[3], row[4], row[5] || 0));
    groups[key].breakMinutes += Number(row[5] || 0);
    groups[key].scheduledShifts += 1;
  });

  punchRows.forEach(function (row) {
    const name = cleanName_(row[2]);
    const email = cleanEmail_(row[3]);
    const date = row[5];
    if (!email || !date) return;

    const key = groupKey_(email, date);
    if (!groups[key]) groups[key] = makeGroup_(name || email, email, date);
    if (name) groups[key].name = name;
    groups[key].punches.push({
      timestamp: row[1],
      action: row[4],
      time: row[6],
    });
  });

  const output = Object.keys(groups)
    .sort()
    .map(function (key) {
      const group = groups[key];
      const punches = group.punches.sort(function (a, b) {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      const clockInEntry = punches.find(function (punch) {
        return punch.action === "Clock In";
      });
      const clockOutEntries = punches.filter(function (punch) {
        return punch.action === "Clock Out";
      });
      const clockOutEntry = clockOutEntries[clockOutEntries.length - 1];
      const workedHours =
        clockInEntry && clockOutEntry
          ? calculateHours_(group.date, clockInEntry.time, clockOutEntry.time, group.breakMinutes)
          : 0;

      return [
        group.name,
        group.email,
        group.date,
        clockInEntry ? normalizeTime_(clockInEntry.time) : "",
        clockOutEntry ? normalizeTime_(clockOutEntry.time) : "",
        group.breakMinutes,
        workedHours,
        roundHours_(group.scheduledHours),
        roundHours_(workedHours - group.scheduledHours),
        group.scheduledShifts,
        getTimesheetStatus_(clockInEntry, clockOutEntry),
      ];
    });

  clearBody_(timesheetSheet);
  if (output.length) appendRows_(timesheetSheet, output);
  buildSummary_();
  if (shouldAlert) SpreadsheetApp.getUi().alert("Timesheets refreshed with " + output.length + " row(s).");
}

function addClockEntry_(action) {
  const employee = promptEmployeeIdentity_();
  const now = new Date();
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.timeClock);

  upsertEmployee_(employee);
  appendRows_(sheet, [[makeId_("CLK"), now, employee.name, employee.email, action, normalizeDate_(now), normalizeTime_(now), ""]]);
  refreshTimesheets_(false);
  SpreadsheetApp.getUi().alert(action + " recorded for " + employee.name + ".");
}

function clockPortal_(action, identity) {
  return runPortalSafely_("Portal " + action, function () {
    if (HOURS_TRACKER.punchActions.indexOf(action) === -1) throw new Error("Invalid clock action: " + action);

    const employee = normalizePortalIdentity_(identity, true);
    const now = new Date();
    const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.timeClock);

    upsertEmployee_(employee);
    appendRows_(sheet, [[makeId_("CLK"), now, employee.name, employee.email, action, normalizeDate_(now), normalizeTime_(now), ""]]);
    refreshTimesheets_(false);
    return getPortalData(employee);
  });
}

function getScheduleForEmail_(email) {
  const normalizedEmail = cleanEmail_(email);
  const rows = getBodyRows_(ss_().getSheetByName(HOURS_TRACKER.sheets.schedule)).map(function (item) {
    return item.row;
  });

  return rows
    .filter(function (row) {
      return cleanEmail_(row[1]) === normalizedEmail;
    })
    .map(function (row) {
      return {
        date: formatDateForInput_(row[2]),
        startTime: formatTimeForInput_(row[3]),
        endTime: formatTimeForInput_(row[4]),
        breakMinutes: Number(row[5] || 0),
        roleJob: row[6] || "",
        notes: row[7] || "",
        scheduledHours: Number(row[8] || 0),
        lastUpdated: row[9] ? formatDateTimeForDisplay_(row[9]) : "",
      };
    });
}

function getTimesheetsForEmail_(email) {
  const normalizedEmail = cleanEmail_(email);
  const rows = getBodyRows_(ss_().getSheetByName(HOURS_TRACKER.sheets.timesheets)).map(function (item) {
    return item.row;
  });

  return rows
    .filter(function (row) {
      return cleanEmail_(row[1]) === normalizedEmail;
    })
    .map(function (row) {
      return {
        date: formatDateForInput_(row[2]),
        clockIn: row[3] ? formatTimeForInput_(row[3]) : "",
        clockOut: row[4] ? formatTimeForInput_(row[4]) : "",
        breakMinutes: Number(row[5] || 0),
        workedHours: Number(row[6] || 0),
        scheduledHours: Number(row[7] || 0),
        variance: Number(row[8] || 0),
        scheduledShifts: Number(row[9] || 0),
        status: row[10] || "",
      };
    });
}

function deleteScheduleRowsForEmail_(email) {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  const normalizedEmail = cleanEmail_(email);
  const rows = getBodyRows_(sheet);

  rows
    .filter(function (item) {
      return cleanEmail_(item.row[1]) === normalizedEmail;
    })
    .map(function (item) {
      return item.index;
    })
    .sort(function (a, b) {
      return b - a;
    })
    .forEach(function (rowIndex) {
      sheet.deleteRow(rowIndex);
    });
}

function normalizePortalIdentity_(identity, requireName) {
  const payload = identity || {};
  const email = cleanEmail_(payload.email || Session.getActiveUser().getEmail());
  if (!email) throw new Error("Enter your employee email before loading or saving the portal.");

  const existingEmployee = findEmployeeByEmail_(email);
  const name = cleanName_(payload.name || (existingEmployee && existingEmployee.name) || "");
  if (requireName && !name) throw new Error("Enter your employee name before saving or clocking time.");

  return { name: name, email: email };
}

function normalizePortalShift_(shift, rowNumber) {
  const payload = shift || {};
  const hasAnyValue =
    payload.date || payload.startTime || payload.endTime || payload.breakMinutes || payload.roleJob || payload.notes;
  if (!hasAnyValue) return null;
  if (!payload.date || !payload.startTime || !payload.endTime) {
    throw new Error("Portal shift " + rowNumber + " needs Date, Start Time, and End Time.");
  }

  const breakMinutes = Number(payload.breakMinutes || 0);
  if (breakMinutes < 0) throw new Error("Portal shift " + rowNumber + " has an invalid break value.");

  const normalized = {
    date: normalizeDate_(payload.date),
    startTime: normalizeTime_(payload.startTime),
    endTime: normalizeTime_(payload.endTime),
    breakMinutes: breakMinutes,
    roleJob: payload.roleJob || "",
    notes: payload.notes || "",
    scheduledHours: 0,
  };
  normalized.scheduledHours = calculateHours_(
    normalized.date,
    normalized.startTime,
    normalized.endTime,
    normalized.breakMinutes,
  );
  return normalized;
}

function buildSummary_() {
  const summarySheet = ss_().getSheetByName(HOURS_TRACKER.sheets.summary);
  const rows = getBodyRows_(ss_().getSheetByName(HOURS_TRACKER.sheets.timesheets)).map(function (item) {
    return item.row;
  });
  const settings = getSettings_();
  const payPeriod = formatSettingDate_(settings["Pay Period Start"]) + " to " + formatSettingDate_(settings["Pay Period End"]);
  const groups = {};

  rows.forEach(function (row) {
    const name = cleanName_(row[0]);
    const email = cleanEmail_(row[1]);
    if (!email) return;

    if (!groups[email]) {
      groups[email] = {
        name: name,
        email: email,
        scheduled: 0,
        worked: 0,
        openPunches: 0,
        scheduledShifts: 0,
      };
    }

    if (name) groups[email].name = name;
    groups[email].scheduled += Number(row[7] || 0);
    groups[email].worked += Number(row[6] || 0);
    if (row[10] === "No Clock Out") groups[email].openPunches += 1;
    groups[email].scheduledShifts += Number(row[9] || 0);
  });

  const output = Object.keys(groups)
    .sort()
    .map(function (email) {
      const group = groups[email];
      return [
        group.name,
        group.email,
        roundHours_(group.scheduled),
        roundHours_(group.worked),
        roundHours_(group.worked - group.scheduled),
        group.openPunches,
        group.scheduledShifts,
        payPeriod,
      ];
    });

  clearBody_(summarySheet);
  if (output.length) appendRows_(summarySheet, output);
}

function seedSettings_() {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.settings);
  const existing = getSettings_();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const rows = [];

  if (!existing.Timezone) rows.push(["Timezone", Session.getScriptTimeZone(), "Used for date and time formatting."]);
  if (!existing["Pay Period Start"]) rows.push(["Pay Period Start", start, "Change this when you run payroll."]);
  if (!existing["Pay Period End"]) rows.push(["Pay Period End", end, "Change this when you run payroll."]);
  if (!existing["Schedule Owner Rule"]) {
    rows.push(["Schedule Owner Rule", "Name + Email", "Portal rows are filtered by employee email."]);
  }

  if (rows.length) appendRows_(sheet, rows);
}

function formatWorkbook_() {
  const ss = ss_();

  Object.keys(HOURS_TRACKER.sheets).forEach(function (key) {
    const sheet = ss.getSheetByName(HOURS_TRACKER.sheets[key]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HOURS_TRACKER.headers[key].length);
    sheet
      .getRange(1, 1, 1, HOURS_TRACKER.headers[key].length)
      .setFontWeight("bold")
      .setBackground("#0f766e")
      .setFontColor("#ffffff");
    sheet.getDataRange().setVerticalAlignment("middle");
  });

  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.schedule), [3]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.schedule), [4, 5]);
  setDateTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.schedule), [10]);
  setDateTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock), [2]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock), [6]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock), [7]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets), [3]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets), [4, 5]);
  setDateTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.errorLog), [1]);
}

function applyValidations_() {
  const timeClock = ss_().getSheetByName(HOURS_TRACKER.sheets.timeClock);
  const timesheets = ss_().getSheetByName(HOURS_TRACKER.sheets.timesheets);

  setListValidation_(timeClock, 5, HOURS_TRACKER.punchActions);
  setListValidation_(timesheets, 11, HOURS_TRACKER.timesheetStatuses);
}

function sortSchedule_() {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  if (sheet.getLastRow() < 3) return;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, HOURS_TRACKER.headers.schedule.length).sort([
    { column: 3, ascending: true },
    { column: 1, ascending: true },
    { column: 4, ascending: true },
  ]);
}

function ss_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found. Open the Google Sheet first, then use Extensions > Apps Script.");
  }
  return ss;
}

function ensureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some(function (header, index) {
    return current[index] !== header;
  });
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function appendRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function getBodyRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2) return [];
  return sheet
    .getRange(2, 1, lastRow - 1, lastColumn)
    .getValues()
    .map(function (row, index) {
      return { row: row, index: index + 2 };
    });
}

function clearBody_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
}

function runSafely_(action, callback) {
  try {
    return callback();
  } catch (error) {
    logError_(action, error);
    showErrorAlert_(action, error);
    throw error;
  }
}

function runPortalSafely_(action, callback) {
  try {
    return callback();
  } catch (error) {
    logError_(action, error);
    throw error;
  }
}

function logError_(action, error) {
  const message = error && error.message ? error.message : String(error);
  const stack = error && error.stack ? error.stack : "";

  try {
    const sheet = ensureSheet_(ss_(), HOURS_TRACKER.sheets.errorLog);
    setHeader_(sheet, HOURS_TRACKER.headers.errorLog);
    appendRows_(sheet, [[new Date(), action, message, stack]]);
  } catch (loggingError) {
    Logger.log("Hours Tracker error during " + action + ": " + message);
    Logger.log(stack);
    Logger.log("Could not write Error Log tab: " + (loggingError.message || loggingError));
  }
}

function showErrorAlert_(action, error) {
  const message = error && error.message ? error.message : String(error);

  try {
    SpreadsheetApp.getUi().alert(
      'Hours Tracker error while running "' + action + '":\n\n' + message + "\n\nCheck the Error Log tab for details.",
    );
  } catch (alertError) {
    Logger.log("Could not show error alert: " + (alertError.message || alertError));
  }
}

function promptEmployeeIdentity_() {
  const ui = SpreadsheetApp.getUi();
  const emailGuess = cleanEmail_(Session.getActiveUser().getEmail());
  const emailResponse = ui.prompt(
    "Employee email",
    "Enter the employee email. This is the main identifier for schedule and hours.",
    ui.ButtonSet.OK_CANCEL,
  );

  if (emailResponse.getSelectedButton() !== ui.Button.OK) throw new Error("Employee email is required.");
  const email = cleanEmail_(emailResponse.getResponseText() || emailGuess);
  if (!email) throw new Error("Employee email is required.");

  const existing = findEmployeeByEmail_(email);
  const nameResponse = ui.prompt("Employee name", "Enter the employee full name.", ui.ButtonSet.OK_CANCEL);
  if (nameResponse.getSelectedButton() !== ui.Button.OK) throw new Error("Employee name is required.");

  const name = cleanName_(nameResponse.getResponseText() || (existing && existing.name));
  if (!name) throw new Error("Employee name is required.");
  return { name: name, email: email };
}

function upsertEmployee_(employee) {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.employees);
  const rows = getBodyRows_(sheet);
  const match = rows.find(function (item) {
    return cleanEmail_(item.row[1]) === employee.email;
  });

  if (match) {
    sheet.getRange(match.index, 1, 1, 2).setValues([[employee.name, employee.email]]);
    return;
  }
  appendRows_(sheet, [[employee.name, employee.email]]);
}

function findEmployeeByEmail_(email) {
  const rows = getBodyRows_(ss_().getSheetByName(HOURS_TRACKER.sheets.employees)).map(function (item) {
    return item.row;
  });
  const normalizedEmail = cleanEmail_(email);
  const match = rows.find(function (row) {
    return cleanEmail_(row[1]) === normalizedEmail;
  });
  if (!match) return null;
  return {
    name: cleanName_(match[0]),
    email: cleanEmail_(match[1]),
  };
}

function getSettings_() {
  const sheet = ss_().getSheetByName(HOURS_TRACKER.sheets.settings);
  if (!sheet) return {};
  return getBodyRows_(sheet)
    .map(function (item) {
      return item.row;
    })
    .reduce(function (settings, row) {
      if (row[0]) settings[row[0]] = row[1];
      return settings;
    }, {});
}

function calculateHours_(dateValue, startValue, endValue, breakMinutes) {
  const start = combineDateAndTime_(dateValue, startValue);
  let end = combineDateAndTime_(dateValue, endValue);
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  const rawHours = (end - start) / (1000 * 60 * 60);
  return roundHours_(Math.max(0, rawHours - Number(breakMinutes || 0) / 60));
}

function combineDateAndTime_(dateValue, timeValue) {
  const date = normalizeDate_(dateValue);
  const time = normalizeTime_(timeValue);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
}

function normalizeDate_(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === "number") {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
  }

  const text = String(value || "").trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date: " + value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeTime_(value) {
  if (value instanceof Date) return new Date(1899, 11, 30, value.getHours(), value.getMinutes(), 0, 0);
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    return new Date(1899, 11, 30, Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  }

  const text = String(value || "").trim();
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (timeMatch) return new Date(1899, 11, 30, Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);

  const parsed = new Date("January 1, 2000 " + text);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid time: " + value);
  return new Date(1899, 11, 30, parsed.getHours(), parsed.getMinutes(), 0, 0);
}

function groupKey_(email, dateValue) {
  const date = normalizeDate_(dateValue);
  return cleanEmail_(email) + "|" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

function makeGroup_(name, email, dateValue) {
  return {
    name: cleanName_(name),
    email: cleanEmail_(email),
    date: normalizeDate_(dateValue),
    scheduledHours: 0,
    breakMinutes: 0,
    scheduledShifts: 0,
    punches: [],
  };
}

function getTimesheetStatus_(clockInEntry, clockOutEntry) {
  if (clockInEntry && clockOutEntry) return "Complete";
  if (clockInEntry && !clockOutEntry) return "No Clock Out";
  return "No Clock In";
}

function cleanName_(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function roundHours_(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatSettingDate_(value) {
  if (!value) return "";
  return Utilities.formatDate(normalizeDate_(value), Session.getScriptTimeZone(), "M/d/yyyy");
}

function formatDateForInput_(value) {
  if (!value) return "";
  return Utilities.formatDate(normalizeDate_(value), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatTimeForInput_(value) {
  if (!value) return "";
  return Utilities.formatDate(normalizeTime_(value), Session.getScriptTimeZone(), "HH:mm");
}

function formatDateTimeForDisplay_(value) {
  if (!value) return "";
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "M/d/yyyy h:mm a");
}

function makeId_(prefix) {
  return (
    prefix +
    "-" +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") +
    "-" +
    Math.floor(Math.random() * 10000)
  );
}

function setListValidation_(sheet, column, values) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function setDateFormats_(sheet, columns) {
  columns.forEach(function (column) {
    sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("m/d/yyyy");
  });
}

function setTimeFormats_(sheet, columns) {
  columns.forEach(function (column) {
    sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("h:mm AM/PM");
  });
}

function setDateTimeFormats_(sheet, columns) {
  columns.forEach(function (column) {
    sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("m/d/yyyy h:mm AM/PM");
  });
}
