// api/send-code.js
//
// POST /api/send-code   { "email": "user@example.com" }
// GET  /api/send-code?email=user@example.com
//
// Forwards to your Apps Script as ?action=sendCode&email=...

import { callGas, setCors, DEFAULT_EMAIL_SUBJECT } from "./_lib/gasClient.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Use GET or POST" });
  }

  const email = req.method === "GET" ? req.query.email : req.body?.email;
  // Optional — lets a caller customize the email subject/body. If omitted,
  // we fall back to DEFAULT_EMAIL_SUBJECT so the Apps Script always
  // receives a non-empty subject (its "no subject" error means this was
  // previously missing).
  const subject =
    (req.method === "GET" ? req.query.subject : req.body?.subject) ||
    DEFAULT_EMAIL_SUBJECT;
  const message = req.method === "GET" ? req.query.message : req.body?.message;

  if (!email) {
    return res.status(400).json({ success: false, error: "email প্রয়োজন" });
  }

  try {
    const { status, data } = await callGas({
      action: "sendCode",
      email,
      subject,
      ...(message ? { message } : {}),
    });
    return res.status(status).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ success: false, error: "Apps Script এ পৌঁছানো যায়নি", message: err.message });
  }
}
