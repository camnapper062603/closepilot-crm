function doGet() {
  return HtmlService.createHtmlOutputFromFile("EmployeePortal")
    .setTitle("Employee Schedule Portal")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doget() {
  return doGet();
}

var HOURS_TRACKER = {
  sheets: {
    settings: "Settings",
    employees: "Employees",
    schedule: "Employee Schedule",
    timeClock: "Time Clock",
    timesheets: "Timesheets",
    summary: "Summary",
    errorLog: "Error Log"
  },
  headers: {
    settings: ["Setting", "Value", "Notes"],
    employees: ["Employee Name", "Employee Email"],
    schedule: ["Employee Name", "Employee Email", "Date", "Start Time", "End Time", "Break Minutes", "Role/Job", "Notes", "Scheduled Hours", "Last Updated"],
    timeClock: ["Entry ID", "Timestamp", "Employee Name", "Employee Email", "Action", "Work Date", "Clock Time", "Notes"],
    timesheets: ["Employee Name", "Employee Email", "Date", "Clock In", "Clock Out", "Break Minutes", "Worked Hours", "Scheduled Hours", "Variance", "Scheduled Shifts", "Status"],
    summary: ["Employee Name", "Employee Email", "Scheduled Hours", "Worked Hours", "Variance", "Open Punches", "Scheduled Shifts", "Pay Period"],
    errorLog: ["Timestamp", "Action", "Message", "Stack"]
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Hours Tracker")
    .addItem("Setup or refresh workbook", "setupHoursTracker")
    .addSeparator()
    .addItem("Save/update schedule rows", "saveEmployeeSchedule")
    .addItem("Clock in", "clockIn")
    .addItem("Clock out", "clockOut")
    .addItem("Refresh timesheets and summary", "refreshTimesheets")
    .addToUi();
}

function setupHoursTracker() {
  return runSafely_("Setup workbook", function () {
    var ss = getSpreadsheet_();
    Object.keys(HOURS_TRACKER.sheets).forEach(function (key) {
      var sheet = ensureSheet_(ss, HOURS_TRACKER.sheets[key]);
      setHeader_(sheet, HOURS_TRACKER.headers[key]);
    });
    seedSettings_();
    formatWorkbook_();
    applyValidations_();
    SpreadsheetApp.getUi().alert("Hours Tracker is ready. Deploy the web app and share the portal URL.");
  });
}

function saveEmployeeSchedule() {
  return runSafely_("Save employee schedule", function () {
    saveMasterScheduleRows_();
  });
}

function clockIn() {
  return runSafely_("Clock in", function () {
    addClockEntryFromPrompt_("Clock In");
  });
}

function clockOut() {
  return runSafely_("Clock out", function () {
    addClockEntryFromPrompt_("Clock Out");
  });
}

function refreshTimesheets(showAlert) {
  return runSafely_("Refresh timesheets", function () {
    refreshTimesheets_(showAlert);
  });
}

function getPortalBootstrap() {
  return runPortalSafely_("Portal bootstrap", function () {
    var settings = getSettings_();
    var emailGuess = cleanEmail_(Session.getActiveUser().getEmail());
    var existing = emailGuess ? findEmployeeByEmail_(emailGuess) : null;
    return {
      emailGuess: emailGuess,
      nameGuess: existing ? existing.name : "",
      today: formatDateForInput_(new Date()),
      payPeriod: {
        start: formatDateForDisplay_(settings["Pay Period Start"]),
        end: formatDateForDisplay_(settings["Pay Period End"])
      }
    };
  });
}

function getPortalData(identity) {
  return runPortalSafely_("Portal load schedule", function () {
    var employee = normalizePortalIdentity_(identity, false);
    var existing = findEmployeeByEmail_(employee.email);
    return {
      employee: {
        name: employee.name || (existing ? existing.name : ""),
        email: employee.email
      },
      schedule: getScheduleForEmail_(employee.email),
      timesheets: getTimesheetsForEmail_(employee.email)
    };
  });
}

function savePortalSchedule(payload) {
  return runPortalSafely_("Portal save schedule", function () {
    var employee = normalizePortalIdentity_(payload, true);
    var shifts = (payload && payload.shifts ? payload.shifts : [])
      .map(function (shift, index) {
        return normalizePortalShift_(shift, index + 1);
      })
      .filter(function (shift) {
        return shift;
      });
    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);
    try {
      deleteScheduleRowsForEmail_(employee.email);
      if (shifts.length) {
        appendRows_(
          getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.schedule),
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
              new Date()
            ];
          })
        );
      }
      upsertEmployee_(employee);
      sortSchedule_();
      refreshTimesheets_(false);
      return getPortalData(employee);
    } finally {
      lock.releaseLock();
    }
  });
}

function portalClockIn(identity) {
  return addClockEntryFromPortal_("Clock In", identity);
}

function portalClockOut(identity) {
  return addClockEntryFromPortal_("Clock Out", identity);
}

function saveMasterScheduleRows_() {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  var rows = getBodyRows_(sheet);
  var now = new Date();
  var updated = 0;
  rows.forEach(function (item) {
    var row = item.row;
    var name = cleanName_(row[0]);
    var email = cleanEmail_(row[1]);
    var date = row[2];
    var start = row[3];
    var end = row[4];
    if (!name && !email && !date && !start && !end) return;
    if (!name || !email || !date || !start || !end) {
      throw new Error("Row " + item.index + " needs name, email, date, start time, and end time.");
    }
    var breakMinutes = Number(row[5] || 0);
    var scheduledHours = calculateHours_(date, start, end, breakMinutes);
    sheet.getRange(item.index, 1, 1, HOURS_TRACKER.headers.schedule.length).setValues([[
      name,
      email,
      normalizeDate_(date),
      normalizeTime_(start),
      normalizeTime_(end),
      breakMinutes,
      row[6] || "",
      row[7] || "",
      scheduledHours,
      now
    ]]);
    upsertEmployee_({ name: name, email: email });
    updated += 1;
  });
  sortSchedule_();
  refreshTimesheets_(false);
  SpreadsheetApp.getUi().alert(updated + " schedule row(s) saved.");
}

function addClockEntryFromPrompt_(action) {
  var employee = promptEmployeeIdentity_();
  addClockEntry_(employee, action);
  SpreadsheetApp.getUi().alert(action + " recorded for " + employee.name + ".");
}

function addClockEntryFromPortal_(action, identity) {
  return runPortalSafely_("Portal " + action, function () {
    var employee = normalizePortalIdentity_(identity, true);
    addClockEntry_(employee, action);
    return getPortalData(employee);
  });
}

function addClockEntry_(employee, action) {
  var now = new Date();
  upsertEmployee_(employee);
  appendRows_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.timeClock), [[
    makeId_("CLK"),
    now,
    employee.name,
    employee.email,
    action,
    normalizeDate_(now),
    normalizeTime_(now),
    ""
  ]]);
  refreshTimesheets_(false);
}

function refreshTimesheets_(showAlert) {
  var ss = getSpreadsheet_();
  var scheduleRows = getBodyRows_(ss.getSheetByName(HOURS_TRACKER.sheets.schedule)).map(function (item) {
    return item.row;
  });
  var punchRows = getBodyRows_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock)).map(function (item) {
    return item.row;
  });
  var groups = {};

  scheduleRows.forEach(function (row) {
    var name = cleanName_(row[0]);
    var email = cleanEmail_(row[1]);
    var date = row[2];
    if (!name || !email || !date) return;
    var key = groupKey_(email, date);
    if (!groups[key]) groups[key] = makeGroup_(name, email, date);
    groups[key].name = name;
    groups[key].scheduledHours += Number(row[8] || calculateHours_(date, row[3], row[4], row[5] || 0));
    groups[key].breakMinutes += Number(row[5] || 0);
    groups[key].scheduledShifts += 1;
  });

  punchRows.forEach(function (row) {
    var name = cleanName_(row[2]);
    var email = cleanEmail_(row[3]);
    var date = row[5];
    if (!email || !date) return;
    var key = groupKey_(email, date);
    if (!groups[key]) groups[key] = makeGroup_(name || email, email, date);
    if (name) groups[key].name = name;
    groups[key].punches.push({ timestamp: row[1], action: row[4], time: row[6] });
  });

  var output = Object.keys(groups).sort().map(function (key) {
    var group = groups[key];
    var punches = group.punches.sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    var clockInEntry = punches.find(function (punch) {
      return punch.action === "Clock In";
    });
    var clockOutEntries = punches.filter(function (punch) {
      return punch.action === "Clock Out";
    });
    var clockOutEntry = clockOutEntries[clockOutEntries.length - 1];
    var workedHours = clockInEntry && clockOutEntry
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
      getTimesheetStatus_(clockInEntry, clockOutEntry)
    ];
  });

  var timesheetSheet = ss.getSheetByName(HOURS_TRACKER.sheets.timesheets);
  clearBody_(timesheetSheet);
  if (output.length) appendRows_(timesheetSheet, output);
  buildSummary_();
  if (showAlert !== false) SpreadsheetApp.getUi().alert("Timesheets refreshed.");
}

function buildSummary_() {
  var ss = getSpreadsheet_();
  var settings = getSettings_();
  var payPeriod = formatDateForDisplay_(settings["Pay Period Start"]) + " to " + formatDateForDisplay_(settings["Pay Period End"]);
  var rows = getBodyRows_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets)).map(function (item) {
    return item.row;
  });
  var groups = {};
  rows.forEach(function (row) {
    var name = cleanName_(row[0]);
    var email = cleanEmail_(row[1]);
    if (!email) return;
    if (!groups[email]) {
      groups[email] = { name: name, email: email, scheduled: 0, worked: 0, openPunches: 0, scheduledShifts: 0 };
    }
    if (name) groups[email].name = name;
    groups[email].scheduled += Number(row[7] || 0);
    groups[email].worked += Number(row[6] || 0);
    if (row[10] === "No Clock Out") groups[email].openPunches += 1;
    groups[email].scheduledShifts += Number(row[9] || 0);
  });
  var output = Object.keys(groups).sort().map(function (email) {
    var group = groups[email];
    return [
      group.name,
      group.email,
      roundHours_(group.scheduled),
      roundHours_(group.worked),
      roundHours_(group.worked - group.scheduled),
      group.openPunches,
      group.scheduledShifts,
      payPeriod
    ];
  });
  var summarySheet = ss.getSheetByName(HOURS_TRACKER.sheets.summary);
  clearBody_(summarySheet);
  if (output.length) appendRows_(summarySheet, output);
}

function getScheduleForEmail_(email) {
  var normalizedEmail = cleanEmail_(email);
  return getBodyRows_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.schedule))
    .map(function (item) {
      return item.row;
    })
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
        lastUpdated: row[9] ? formatDateTimeForDisplay_(row[9]) : ""
      };
    });
}

function getTimesheetsForEmail_(email) {
  var normalizedEmail = cleanEmail_(email);
  return getBodyRows_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.timesheets))
    .map(function (item) {
      return item.row;
    })
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
        status: row[10] || ""
      };
    });
}

function deleteScheduleRowsForEmail_(email) {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  var normalizedEmail = cleanEmail_(email);
  getBodyRows_(sheet)
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

function normalizePortalIdentity_(payload, requireName) {
  payload = payload || {};
  var email = cleanEmail_(payload.email || Session.getActiveUser().getEmail());
  if (!email) throw new Error("Enter your employee email first.");
  var existing = findEmployeeByEmail_(email);
  var name = cleanName_(payload.name || (existing ? existing.name : ""));
  if (requireName && !name) throw new Error("Enter your employee name first.");
  return { name: name, email: email };
}

function normalizePortalShift_(shift, rowNumber) {
  shift = shift || {};
  var hasAnyValue = shift.date || shift.startTime || shift.endTime || shift.breakMinutes || shift.roleJob || shift.notes;
  if (!hasAnyValue) return null;
  if (!shift.date || !shift.startTime || !shift.endTime) {
    throw new Error("Shift " + rowNumber + " needs date, start time, and end time.");
  }
  var breakMinutes = Number(shift.breakMinutes || 0);
  if (breakMinutes < 0) throw new Error("Shift " + rowNumber + " has an invalid break value.");
  var normalized = {
    date: normalizeDate_(shift.date),
    startTime: normalizeTime_(shift.startTime),
    endTime: normalizeTime_(shift.endTime),
    breakMinutes: breakMinutes,
    roleJob: shift.roleJob || "",
    notes: shift.notes || "",
    scheduledHours: 0
  };
  normalized.scheduledHours = calculateHours_(normalized.date, normalized.startTime, normalized.endTime, breakMinutes);
  return normalized;
}

function seedSettings_() {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.settings);
  var settings = getSettings_();
  var today = new Date();
  var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  var rows = [];
  if (!settings.Timezone) rows.push(["Timezone", Session.getScriptTimeZone(), "Used for date and time formatting."]);
  if (!settings["Pay Period Start"]) rows.push(["Pay Period Start", start, "First day of the pay period."]);
  if (!settings["Pay Period End"]) rows.push(["Pay Period End", end, "Last day of the pay period."]);
  if (!settings["Schedule Owner Rule"]) rows.push(["Schedule Owner Rule", "Name + Email", "Portal rows are filtered by email."]);
  if (rows.length) appendRows_(sheet, rows);
}

function formatWorkbook_() {
  var ss = getSpreadsheet_();
  Object.keys(HOURS_TRACKER.sheets).forEach(function (key) {
    var sheet = ss.getSheetByName(HOURS_TRACKER.sheets[key]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HOURS_TRACKER.headers[key].length);
    sheet.getRange(1, 1, 1, HOURS_TRACKER.headers[key].length)
      .setFontWeight("bold")
      .setBackground("#0f766e")
      .setFontColor("#ffffff");
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
  setListValidation_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.timeClock), 5, ["Clock In", "Clock Out"]);
  setListValidation_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.timesheets), 11, ["Complete", "No Clock In", "No Clock Out"]);
}

function sortSchedule_() {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.schedule);
  if (sheet.getLastRow() < 3) return;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, HOURS_TRACKER.headers.schedule.length).sort([
    { column: 3, ascending: true },
    { column: 1, ascending: true },
    { column: 4, ascending: true }
  ]);
}

function getSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No active spreadsheet found. Open the Google Sheet, then Extensions > Apps Script.");
  return ss;
}

function ensureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeader_(sheet, headers) {
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeader = headers.some(function (header, index) {
    return current[index] !== header;
  });
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function appendRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function getBodyRows_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues().map(function (row, index) {
    return { row: row, index: index + 2 };
  });
}

function clearBody_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
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
  var message = error && error.message ? error.message : String(error);
  var stack = error && error.stack ? error.stack : "";
  try {
    var sheet = ensureSheet_(getSpreadsheet_(), HOURS_TRACKER.sheets.errorLog);
    setHeader_(sheet, HOURS_TRACKER.headers.errorLog);
    appendRows_(sheet, [[new Date(), action, message, stack]]);
  } catch (loggingError) {
    Logger.log("Hours Tracker error during " + action + ": " + message);
    Logger.log(stack);
    Logger.log("Could not write Error Log tab: " + (loggingError.message || loggingError));
  }
}

function showErrorAlert_(action, error) {
  var message = error && error.message ? error.message : String(error);
  try {
    SpreadsheetApp.getUi().alert("Hours Tracker error while running " + action + ":\n\n" + message);
  } catch (alertError) {
    Logger.log("Could not show error alert: " + (alertError.message || alertError));
  }
}

function promptEmployeeIdentity_() {
  var ui = SpreadsheetApp.getUi();
  var emailResponse = ui.prompt("Employee email", "Enter the employee email.", ui.ButtonSet.OK_CANCEL);
  if (emailResponse.getSelectedButton() !== ui.Button.OK) throw new Error("Employee email is required.");
  var email = cleanEmail_(emailResponse.getResponseText());
  if (!email) throw new Error("Employee email is required.");
  var existing = findEmployeeByEmail_(email);
  var nameResponse = ui.prompt("Employee name", "Enter the employee full name.", ui.ButtonSet.OK_CANCEL);
  if (nameResponse.getSelectedButton() !== ui.Button.OK) throw new Error("Employee name is required.");
  var name = cleanName_(nameResponse.getResponseText() || (existing ? existing.name : ""));
  if (!name) throw new Error("Employee name is required.");
  return { name: name, email: email };
}

function upsertEmployee_(employee) {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.employees);
  var rows = getBodyRows_(sheet);
  var match = rows.find(function (item) {
    return cleanEmail_(item.row[1]) === employee.email;
  });
  if (match) {
    sheet.getRange(match.index, 1, 1, 2).setValues([[employee.name, employee.email]]);
  } else {
    appendRows_(sheet, [[employee.name, employee.email]]);
  }
}

function findEmployeeByEmail_(email) {
  var normalizedEmail = cleanEmail_(email);
  var rows = getBodyRows_(getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.employees)).map(function (item) {
    return item.row;
  });
  var match = rows.find(function (row) {
    return cleanEmail_(row[1]) === normalizedEmail;
  });
  return match ? { name: cleanName_(match[0]), email: cleanEmail_(match[1]) } : null;
}

function getSettings_() {
  var sheet = getSpreadsheet_().getSheetByName(HOURS_TRACKER.sheets.settings);
  if (!sheet) return {};
  return getBodyRows_(sheet).reduce(function (settings, item) {
    if (item.row[0]) settings[item.row[0]] = item.row[1];
    return settings;
  }, {});
}

function calculateHours_(dateValue, startValue, endValue, breakMinutes) {
  var start = combineDateAndTime_(dateValue, startValue);
  var end = combineDateAndTime_(dateValue, endValue);
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return roundHours_(Math.max(0, (end - start) / (1000 * 60 * 60) - Number(breakMinutes || 0) / 60));
}

function combineDateAndTime_(dateValue, timeValue) {
  var date = normalizeDate_(dateValue);
  var time = normalizeTime_(timeValue);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
}

function normalizeDate_(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === "number") return new Date(new Date(1899, 11, 30).getTime() + value * 24 * 60 * 60 * 1000);
  var text = String(value || "").trim();
  var isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  var parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date: " + value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeTime_(value) {
  if (value instanceof Date) return new Date(1899, 11, 30, value.getHours(), value.getMinutes(), 0, 0);
  if (typeof value === "number") {
    var totalMinutes = Math.round(value * 24 * 60);
    return new Date(1899, 11, 30, Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  }
  var text = String(value || "").trim();
  var timeMatch = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (timeMatch) return new Date(1899, 11, 30, Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  var parsed = new Date("January 1, 2000 " + text);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid time: " + value);
  return new Date(1899, 11, 30, parsed.getHours(), parsed.getMinutes(), 0, 0);
}

function groupKey_(email, dateValue) {
  var date = normalizeDate_(dateValue);
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
    punches: []
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

function formatDateForDisplay_(value) {
  return value ? Utilities.formatDate(normalizeDate_(value), Session.getScriptTimeZone(), "M/d/yyyy") : "";
}

function formatDateForInput_(value) {
  return value ? Utilities.formatDate(normalizeDate_(value), Session.getScriptTimeZone(), "yyyy-MM-dd") : "";
}

function formatTimeForInput_(value) {
  return value ? Utilities.formatDate(normalizeTime_(value), Session.getScriptTimeZone(), "HH:mm") : "";
}

function formatDateTimeForDisplay_(value) {
  return value ? Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "M/d/yyyy h:mm a") : "";
}

function makeId_(prefix) {
  return prefix + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 10000);
}

function setListValidation_(sheet, column, values) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
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
