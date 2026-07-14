/**
 * ACE.await contact form — Google Apps Script
 *
 * One-time setup:
 * 1. Create a Google Sheet
 * 2. Copy its ID from the URL:
 *    https://docs.google.com/spreadsheets/d/PASTE_THIS_PART/edit
 * 3. Extensions → Apps Script → paste this file
 * 4. Set SPREADSHEET_ID and RECIPIENT_EMAIL below
 * 5. Run testSetup → authorize both permissions when asked
 * 6. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone          ← must be Anyone, not "Only myself"
 * 7. Copy the Web app URL (ends in /exec) into js/contact-config.js
 *
 * Test: open the /exec URL in an incognito window. You should see
 * "Contact form endpoint is running." — not a Google sign-in page.
 */

const CONFIG = {
  SPREADSHEET_ID: "10JYv8EMHyBjKGD-virH9jfq3GPerWSXF5LuuydIvv6Y",
  RECIPIENT_EMAIL: "h.abedijoo@gmail.com",
  SHEET_NAME: "Contact submissions",
  ALLOWED_ORIGINS: [
    "https://aceconscious.studio",
    "https://www.aceconscious.studio",
    "http://aceconscious.studio",
    "http://www.aceconscious.studio",
    "http://localhost",
    "http://127.0.0.1",
  ],
};

const MESSAGE_TYPE = "ace-contact-form";

function testSetup() {
  getOrCreateSheet_();
  Logger.log("Sheet OK: " + CONFIG.SHEET_NAME);
}

function doGet() {
  return ContentService.createTextOutput("Contact form endpoint is running.");
}

function doPost(e) {
  try {
    const params = parseParams_(e);

    if (params.website) {
      return respond_("success");
    }

    const email = String(params.email || "").trim();
    const message = String(params.message || "").trim();
    const origin = String(params.origin || "").trim();

    if (!email || !message) {
      return respond_("error", "Missing fields");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond_("error", "Invalid email");
    }

    if (origin && !isAllowedOrigin_(origin)) {
      return respond_("error", "Origin not allowed: " + origin);
    }

    getOrCreateSheet_().appendRow([new Date(), email, message, origin]);

    MailApp.sendEmail({
      to: CONFIG.RECIPIENT_EMAIL,
      replyTo: email,
      subject: "ACE.await — message from " + email,
      body:
        "New contact form message\n\n" +
        "From: " +
        email +
        "\n\n" +
        message +
        "\n\n---\nSent via aceconscious.studio contact form",
    });

    return respond_("success");
  } catch (err) {
    Logger.log(err);
    return respond_("error", String(err));
  }
}

function parseParams_(e) {
  const params = Object.assign({}, e.parameter || {});

  if (e.postData && e.postData.contents) {
    try {
      const json = JSON.parse(e.postData.contents);
      Object.keys(json).forEach(function (key) {
        params[key] = json[key];
      });
    } catch (err) {
      // Keep form-encoded params only.
    }
  }

  return params;
}

function isAllowedOrigin_(origin) {
  if (!origin) return true;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  return CONFIG.ALLOWED_ORIGINS.some(function (prefix) {
    return origin.indexOf(prefix) === 0;
  });
}

function getOrCreateSheet_() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set CONFIG.SPREADSHEET_ID to your Google Sheet ID.");
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(["Timestamp", "Email", "Message", "Origin"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
  }
  return sheet;
}

function respond_(status, detail) {
  const payload = {
    type: MESSAGE_TYPE,
    status: status,
    detail: detail || "",
  };
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
