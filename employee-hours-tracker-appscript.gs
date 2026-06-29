/**
 * Employee Hours Tracker for Google Sheets.
 *
 * Paste this file into Extensions > Apps Script, save it, run setupHoursTracker(),
 * then reload the spreadsheet and use the "Hours Tracker" menu.
 */

const HOURS_TRACKER = {
  sheets: {
    settings: "Settings",
    employees: "Employees",
    mySchedule: "My Schedule",
    requests: "Schedule Requests",
    approved: "Approved Schedule",
    timeClock: "Time Clock",
    timesheets: "Timesheets",
    summary: "Summary",
  },
  headers: {
    settings: ["Setting", "Value", "Notes"],
    employees: ["Employee ID", "Name", "Email", "Role", "Hourly Rate", "Status", "Manager?"],
    mySchedule: ["Employee Email", "Date", "Start Time", "End Time", "Break Minutes", "Role/Job", "Notes"],
    requests: [
      "Request ID",
      "Submitted At",
      "Employee Email",
      "Employee Name",
      "Date",
      "Start Time",
      "End Time",
      "Break Minutes",
      "Role/Job",
      "Notes",
      "Scheduled Hours",
      "Status",
      "Manager Note",
      "Reviewed At",
    ],
    approved: [
      "Request ID",
      "Employee Email",
      "Employee Name",
      "Date",
      "Start Time",
      "End Time",
      "Break Minutes",
      "Role/Job",
      "Scheduled Hours",
      "Status",
      "Updated At",
    ],
    timeClock: ["Entry ID", "Timestamp", "Employee Email", "Employee Name", "Action", "Work Date", "Clock Time", "Notes"],
    timesheets: [
      "Employee Email",
      "Employee Name",
      "Date",
      "Clock In",
      "Clock Out",
      "Break Minutes",
      "Worked Hours",
      "Scheduled Hours",
      "Variance",
      "Status",
    ],
    summary: [
      "Employee Email",
      "Employee Name",
      "Scheduled Hours",
      "Worked Hours",
      "Variance",
      "Open Punches",
      "Approved Shifts",
      "Pay Period",
    ],
  },
  statuses: {
    employee: ["Active", "Inactive"],
    yesNo: ["Yes", "No"],
    request: ["Pending", "Approved", "Rejected"],
    approved: ["Approved", "Cancelled"],
    punch: ["Clock In", "Clock Out"],
    timesheet: ["Complete", "Open Punch", "No Clock In", "No Clock Out"],
  },
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Hours Tracker")
    .addItem("Setup or refresh workbook", "setupHoursTracker")
    .addSeparator()
    .addItem("Submit my schedule rows", "submitMySchedule")
    .addItem("Clock in", "clockIn")
    .addItem("Clock out", "clockOut")
    .addSeparator()
    .addItem("Approve selected schedule requests", "approveSelectedRequests")
    .addItem("Reject selected schedule requests", "rejectSelectedRequests")
    .addItem("Refresh timesheets and summary", "refreshTimesheets")
    .addToUi();
}

function setupHoursTracker() {
  const ss = SpreadsheetApp.getActive();

  Object.keys(HOURS_TRACKER.sheets).forEach((key) => {
    const sheet = ensureSheet_(ss, HOURS_TRACKER.sheets[key]);
    setHeader_(sheet, HOURS_TRACKER.headers[key]);
  });

  seedSettings_();
  formatWorkbook_();
  applyValidations_();
  SpreadsheetApp.getUi().alert("Hours Tracker is ready. Add employees, then share the sheet with your team.");
}

function submitMySchedule() {
  const ss = SpreadsheetApp.getActive();
  const inputSheet = ss.getSheetByName(HOURS_TRACKER.sheets.mySchedule);
  const requestSheet = ss.getSheetByName(HOURS_TRACKER.sheets.requests);
  const values = getBodyRows_(inputSheet);
  const submittedAt = new Date();
  const employeeFallback = resolveEmployee_();
  const requests = [];
  const rowsToClear = [];

  values.forEach((item) => {
    const row = item.row;
    const email = String(row[0] || employeeFallback.email || "").trim().toLowerCase();
    const date = row[1];
    const start = row[2];
    const end = row[3];

    if (!email && !date && !start && !end) return;
    if (!email || !date || !start || !end) {
      throw new Error("Each My Schedule row needs Employee Email, Date, Start Time, and End Time.");
    }

    const employee = findEmployeeByEmail_(email) || { email, name: employeeFallback.name || email };
    const breakMinutes = Number(row[4] || 0);
    const scheduledHours = calculateHours_(date, start, end, breakMinutes);

    requests.push([
      makeId_("REQ"),
      submittedAt,
      email,
      employee.name,
      normalizeDate_(date),
      normalizeTime_(start),
      normalizeTime_(end),
      breakMinutes,
      row[5] || "",
      row[6] || "",
      scheduledHours,
      "Pending",
      "",
      "",
    ]);
    rowsToClear.push(item.index);
  });

  if (!requests.length) {
    SpreadsheetApp.getUi().alert("No schedule rows found. Add rows on the My Schedule tab first.");
    return;
  }

  appendRows_(requestSheet, requests);
  rowsToClear.forEach((rowIndex) => inputSheet.getRange(rowIndex, 1, 1, HOURS_TRACKER.headers.mySchedule.length).clearContent());
  SpreadsheetApp.getUi().alert(`${requests.length} schedule request(s) submitted for approval.`);
}

function approveSelectedRequests() {
  updateSelectedRequests_("Approved");
}

function rejectSelectedRequests() {
  updateSelectedRequests_("Rejected");
}

function clockIn() {
  addClockEntry_("Clock In");
}

function clockOut() {
  addClockEntry_("Clock Out");
}

function refreshTimesheets(showAlert) {
  const shouldAlert = showAlert !== false;
  const ss = SpreadsheetApp.getActive();
  const approvedSheet = ss.getSheetByName(HOURS_TRACKER.sheets.approved);
  const clockSheet = ss.getSheetByName(HOURS_TRACKER.sheets.timeClock);
  const timesheetSheet = ss.getSheetByName(HOURS_TRACKER.sheets.timesheets);
  const approvedRows = getBodyRows_(approvedSheet).map((item) => item.row).filter((row) => row[9] === "Approved");
  const punchRows = getBodyRows_(clockSheet).map((item) => item.row);
  const groups = {};

  approvedRows.forEach((row) => {
    const key = groupKey_(row[1], row[3]);
    if (!groups[key]) groups[key] = makeGroup_(row[1], row[2], row[3]);
    groups[key].scheduledHours += Number(row[8] || 0);
    groups[key].breakMinutes += Number(row[6] || 0);
    groups[key].approvedShifts += 1;
  });

  punchRows.forEach((row) => {
    const key = groupKey_(row[2], row[5]);
    if (!groups[key]) groups[key] = makeGroup_(row[2], row[3], row[5]);
    groups[key].punches.push({
      timestamp: row[1],
      action: row[4],
      time: row[6],
    });
  });

  const output = Object.keys(groups)
    .sort()
    .map((key) => {
      const group = groups[key];
      const punches = group.punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const clockInEntry = punches.find((punch) => punch.action === "Clock In");
      const clockOutEntries = punches.filter((punch) => punch.action === "Clock Out");
      const clockOutEntry = clockOutEntries[clockOutEntries.length - 1];
      const workedHours =
        clockInEntry && clockOutEntry
          ? calculateHours_(group.date, clockInEntry.time, clockOutEntry.time, group.breakMinutes)
          : 0;
      const status = getTimesheetStatus_(clockInEntry, clockOutEntry);

      return [
        group.email,
        group.name,
        group.date,
        clockInEntry ? normalizeTime_(clockInEntry.time) : "",
        clockOutEntry ? normalizeTime_(clockOutEntry.time) : "",
        group.breakMinutes,
        workedHours,
        roundHours_(group.scheduledHours),
        roundHours_(workedHours - group.scheduledHours),
        status,
      ];
    });

  clearBody_(timesheetSheet);
  if (output.length) appendRows_(timesheetSheet, output);
  buildSummary_();
  if (shouldAlert) SpreadsheetApp.getUi().alert(`Timesheets refreshed with ${output.length} row(s).`);
}

function updateSelectedRequests_(status) {
  const ss = SpreadsheetApp.getActive();
  const requestSheet = ss.getSheetByName(HOURS_TRACKER.sheets.requests);
  const approvedSheet = ss.getSheetByName(HOURS_TRACKER.sheets.approved);
  const selection = requestSheet.getActiveRange();

  if (!selection || requestSheet.getName() !== ss.getActiveSheet().getName()) {
    SpreadsheetApp.getUi().alert("Select one or more rows on the Schedule Requests tab first.");
    return;
  }

  const startRow = Math.max(selection.getRow(), 2);
  const endRow = selection.getLastRow();
  const rows = [];
  const reviewedAt = new Date();

  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const row = requestSheet.getRange(rowIndex, 1, 1, HOURS_TRACKER.headers.requests.length).getValues()[0];
    if (!row[0] || row[11] !== "Pending") continue;

    requestSheet.getRange(rowIndex, 12).setValue(status);
    requestSheet.getRange(rowIndex, 14).setValue(reviewedAt);

    if (status === "Approved") {
      rows.push([row[0], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[10], "Approved", reviewedAt]);
    }
  }

  if (rows.length) appendRows_(approvedSheet, rows);
  SpreadsheetApp.getUi().alert(`${status} ${status === "Approved" ? rows.length : endRow - startRow + 1} request row(s).`);
}

function addClockEntry_(action) {
  const employee = resolveEmployee_();
  const now = new Date();
  const sheet = SpreadsheetApp.getActive().getSheetByName(HOURS_TRACKER.sheets.timeClock);

  appendRows_(sheet, [[makeId_("CLK"), now, employee.email, employee.name, action, normalizeDate_(now), normalizeTime_(now), ""]]);
  refreshTimesheets(false);
  SpreadsheetApp.getUi().alert(`${action} recorded for ${employee.name}.`);
}

function buildSummary_() {
  const ss = SpreadsheetApp.getActive();
  const summarySheet = ss.getSheetByName(HOURS_TRACKER.sheets.summary);
  const timesheetRows = getBodyRows_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets)).map((item) => item.row);
  const settings = getSettings_();
  const payPeriod = `${settings["Pay Period Start"] || ""} to ${settings["Pay Period End"] || ""}`;
  const groups = {};

  timesheetRows.forEach((row) => {
    const email = row[0];
    if (!email) return;
    if (!groups[email]) {
      groups[email] = {
        email,
        name: row[1],
        scheduled: 0,
        worked: 0,
        openPunches: 0,
        approvedShifts: 0,
      };
    }
    groups[email].scheduled += Number(row[7] || 0);
    groups[email].worked += Number(row[6] || 0);
    if (row[9] === "Open Punch" || row[9] === "No Clock Out") groups[email].openPunches += 1;
    if (Number(row[7] || 0) > 0) groups[email].approvedShifts += 1;
  });

  const output = Object.keys(groups)
    .sort()
    .map((email) => {
      const group = groups[email];
      return [
        group.email,
        group.name,
        roundHours_(group.scheduled),
        roundHours_(group.worked),
        roundHours_(group.worked - group.scheduled),
        group.openPunches,
        group.approvedShifts,
        payPeriod,
      ];
    });

  clearBody_(summarySheet);
  if (output.length) appendRows_(summarySheet, output);
}

function seedSettings_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(HOURS_TRACKER.sheets.settings);
  if (sheet.getLastRow() > 1) return;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

  appendRows_(sheet, [
    ["Timezone", Session.getScriptTimeZone(), "Used for date and time formatting."],
    ["Pay Period Start", start, "Change this when you run payroll."],
    ["Pay Period End", end, "Change this when you run payroll."],
    ["Manager Email", Session.getActiveUser().getEmail(), "Optional. Used for reference."],
    ["Require Manager Approval", "Yes", "Approved shifts move to the Approved Schedule tab."],
  ]);
}

function formatWorkbook_() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HOURS_TRACKER.sheets).forEach((key) => {
    const sheet = ss.getSheetByName(HOURS_TRACKER.sheets[key]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HOURS_TRACKER.headers[key].length);
    sheet.getRange(1, 1, 1, HOURS_TRACKER.headers[key].length).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
    sheet.getDataRange().setVerticalAlignment("middle");
  });

  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.mySchedule), [2]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.mySchedule), [3, 4]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.requests), [2, 5, 14]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.requests), [6, 7]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.approved), [4, 11]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.approved), [5, 6]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock), [2, 6]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timeClock), [7]);
  setDateFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets), [3]);
  setTimeFormats_(ss.getSheetByName(HOURS_TRACKER.sheets.timesheets), [4, 5]);
}

function applyValidations_() {
  const ss = SpreadsheetApp.getActive();
  const employees = ss.getSheetByName(HOURS_TRACKER.sheets.employees);
  const requests = ss.getSheetByName(HOURS_TRACKER.sheets.requests);
  const approved = ss.getSheetByName(HOURS_TRACKER.sheets.approved);
  const timeClock = ss.getSheetByName(HOURS_TRACKER.sheets.timeClock);
  const timesheets = ss.getSheetByName(HOURS_TRACKER.sheets.timesheets);

  setListValidation_(employees, 6, HOURS_TRACKER.statuses.employee);
  setListValidation_(employees, 7, HOURS_TRACKER.statuses.yesNo);
  setListValidation_(requests, 12, HOURS_TRACKER.statuses.request);
  setListValidation_(approved, 10, HOURS_TRACKER.statuses.approved);
  setListValidation_(timeClock, 5, HOURS_TRACKER.statuses.punch);
  setListValidation_(timesheets, 10, HOURS_TRACKER.statuses.timesheet);

  const settings = ss.getSheetByName(HOURS_TRACKER.sheets.settings);
  const approvalSetting = getBodyRows_(settings).find((item) => item.row[0] === "Require Manager Approval");
  if (approvalSetting) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).setAllowInvalid(false).build();
    settings.getRange(approvalSetting.index, 2).setDataValidation(rule);
  }
}

function ensureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const missing = headers.some((header, index) => current[index] !== header);
  if (missing) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
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
    .map((row, index) => ({ row, index: index + 2 }));
}

function clearBody_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
}

function resolveEmployee_() {
  let email = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  if (!email) {
    const response = SpreadsheetApp.getUi().prompt(
      "Employee email",
      "Google did not provide your email. Enter the employee email for this action.",
      SpreadsheetApp.getUi().ButtonSet.OK_CANCEL,
    );
    if (response.getSelectedButton() !== SpreadsheetApp.getUi().Button.OK) throw new Error("Employee email is required.");
    email = response.getResponseText().trim().toLowerCase();
  }

  const employee = findEmployeeByEmail_(email);
  if (employee) return employee;
  return { email, name: email };
}

function findEmployeeByEmail_(email) {
  const rows = getBodyRows_(SpreadsheetApp.getActive().getSheetByName(HOURS_TRACKER.sheets.employees)).map((item) => item.row);
  const match = rows.find((row) => String(row[2] || "").trim().toLowerCase() === String(email || "").trim().toLowerCase());
  if (!match) return null;
  return {
    id: match[0],
    name: match[1],
    email: String(match[2]).trim().toLowerCase(),
    role: match[3],
    hourlyRate: match[4],
    status: match[5],
    isManager: match[6] === "Yes",
  };
}

function getSettings_() {
  const rows = getBodyRows_(SpreadsheetApp.getActive().getSheetByName(HOURS_TRACKER.sheets.settings)).map((item) => item.row);
  return rows.reduce((settings, row) => {
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeTime_(value) {
  if (value instanceof Date) return new Date(1899, 11, 30, value.getHours(), value.getMinutes(), 0, 0);
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    return new Date(1899, 11, 30, Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  }
  const parsed = new Date(`January 1, 2000 ${value}`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid time: ${value}`);
  return new Date(1899, 11, 30, parsed.getHours(), parsed.getMinutes(), 0, 0);
}

function groupKey_(email, dateValue) {
  const date = normalizeDate_(dateValue);
  return `${String(email || "").trim().toLowerCase()}|${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function makeGroup_(email, name, dateValue) {
  return {
    email: String(email || "").trim().toLowerCase(),
    name,
    date: normalizeDate_(dateValue),
    scheduledHours: 0,
    breakMinutes: 0,
    approvedShifts: 0,
    punches: [],
  };
}

function getTimesheetStatus_(clockInEntry, clockOutEntry) {
  if (clockInEntry && clockOutEntry) return "Complete";
  if (clockInEntry && !clockOutEntry) return "No Clock Out";
  if (!clockInEntry && clockOutEntry) return "No Clock In";
  return "No Clock In";
}

function roundHours_(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function makeId_(prefix) {
  return `${prefix}-${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss")}-${Math.floor(Math.random() * 10000)}`;
}

function setListValidation_(sheet, column, values) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function setDateFormats_(sheet, columns) {
  columns.forEach((column) => sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("m/d/yyyy"));
}

function setTimeFormats_(sheet, columns) {
  columns.forEach((column) => sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("h:mm AM/PM"));
}
