// api/bulk-create-users.js
const Papa = require("papaparse");
const XLSX = require("xlsx");

const { createUserCore } = require("../lib/user-core");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

const COLUMN_MAP = {
  "nombre(s)":   "firstName",
  "nombre":      "firstName",
  "apellido(s)": "lastName",
  "apellido":    "lastName",
  "email":       "email",
  "correo":      "email",
  "telefono":    "phone",
  "tel":         "phone",
  "rol":         "role",
  "role":        "role",
};

function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseBuffer(buffer, contentType, fileUrl) {
  const isXlsx =
    contentType.includes("spreadsheetml") ||
    contentType.includes("ms-excel") ||
    fileUrl.includes(".xlsx") ||
    fileUrl.includes(".xls");

  let rows = [];

  if (isXlsx) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  } else {
    const text = buffer.toString("utf8");
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: function(h) { return h.trim(); },
    });
    rows = parsed.data;
  }

  if (!rows || rows.length === 0) {
    throw new Error("The file is empty or has no data rows.");
  }

  return rows.map(function(row, index) {
    var mapped = {};

    Object.entries(row).forEach(function(entry) {
      var rawKey = entry[0];
      var value = entry[1];
      var normalized = normalizeHeader(rawKey);
      var schemaKey = COLUMN_MAP[normalized];
      if (schemaKey && value !== undefined && value !== "") {
        mapped[schemaKey] = String(value).trim();
      }
    });

    var missing = ["firstName", "lastName", "email"].filter(function(k) { return !mapped[k]; });
    if (missing.length > 0) {
      mapped._rowIndex = index + 2;
      mapped._missingFields = missing;
    }

    return mapped;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  var body = req.body || {};
  var companyId = body.companyId;
  var locationId = body.locationId;
  var fileUrl = body.fileUrl;

  if (!companyId)  return sendError(res, 400, "Missing companyId.");
  if (!locationId) return sendError(res, 400, "Missing locationId.");
  if (!fileUrl)    return sendError(res, 400, "Missing fileUrl.");

  var fileBuffer;
  var contentType = "";
  try {
    var fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return sendError(res, 422, "Failed to download file: " + fileResponse.status + " " + fileResponse.statusText);
    }
    contentType = fileResponse.headers.get("content-type") || "";
    var arrayBuffer = await fileResponse.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    return sendError(res, 422, "Failed to fetch file from URL.", err.message);
  }

  var users;
  try {
    users = parseBuffer(fileBuffer, contentType, fileUrl);
  } catch (err) {
    return sendError(res, 422, "Failed to parse file.", err.message);
  }

  var results = [];
  var created = 0;
  var failed  = 0;
  var skipped = 0;

  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var rowNumber = user._rowIndex || (i + 2);

    if (user._missingFields && user._missingFields.length > 0) {
      skipped++;
      results.push({
        row: rowNumber,
        email: user.email || null,
        status: "skipped",
        error: "Missing required fields: " + user._missingFields.join(", "),
      });
      continue;
    }

    try {
      var data = await createUserCore({ companyId: companyId, locationId: locationId, user: user });
      created++;
      results.push({
        row: rowNumber,
        email: user.email,
        status: "created",
        userId: data.userId,
        role: data.role,
        tempPassword: data.tempPassword,
      });
    } catch (err) {
      failed++;
      results.push({
        row: rowNumber,
        email: user.email,
        status: "failed",
        error: err.message,
      });
    }
  }

  return sendResponse(res, 200, {
    success: true,
    locationId: locationId,
    total: users.length,
    created: created,
    failed: failed,
    skipped: skipped,
    results: results,
  });
};
