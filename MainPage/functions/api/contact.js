const RECIPIENT_EMAILS = ["sharvaparalkar@tamu.edu", "akbariae@tamu.edu"];
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_COUNT = 2;
const MAX_REQUEST_BYTES = MAX_TOTAL_PDF_BYTES + 256 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://calab.net",
  "https://www.calab.net",
  "https://calab-site.pages.dev",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
]);

const isAllowedOrigin = (origin) => ALLOWED_ORIGINS.has(origin)
  || /^https:\/\/[a-z0-9-]+\.calab-main\.pages\.dev$/i.test(origin)
  || /^https:\/\/[a-z0-9-]+\.calab-site\.pages\.dev$/i.test(origin);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return json({ error: "This request could not be accepted." }, 403);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: "PDF attachments must be 10 MB or smaller combined. If needed, email them directly to info@calab.net." }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Please complete the form and try again." }, 400);
  }

  // Quietly accept honeypot submissions so bots do not learn they were filtered.
  if (cleanText(form.get("website"), 200)) return json({ ok: true });

  const name = cleanText(form.get("name"), 120);
  const email = cleanText(form.get("email"), 254);
  const subject = cleanText(form.get("subject"), 180);
  const message = cleanText(form.get("message"), 5000);
  if (!name || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please check the name, email, subject, and message fields." }, 400);
  }

  const uploadedFiles = form.getAll("attachment").filter((file) => file && typeof file === "object" && "arrayBuffer" in file && file.size > 0);
  if (uploadedFiles.length > MAX_PDF_COUNT) {
    return json({ error: "You can attach up to two PDFs. If you need to send more, email them directly to info@calab.net." }, 400);
  }

  const totalPdfBytes = uploadedFiles.reduce((total, file) => total + file.size, 0);
  if (totalPdfBytes > MAX_TOTAL_PDF_BYTES) {
    return json({ error: "PDF attachments must be 10 MB or smaller combined. If needed, email them directly to info@calab.net." }, 413);
  }

  const attachments = [];
  for (const uploaded of uploadedFiles) {
    if (!uploaded.name.toLowerCase().endsWith(".pdf") || (uploaded.type && uploaded.type !== "application/pdf")) {
      return json({ error: "Please attach a PDF file only." }, 400);
    }
    if (uploaded.size > MAX_PDF_BYTES) {
      return json({ error: "The PDF must be 10 MB or smaller." }, 413);
    }
    const bytes = new Uint8Array(await uploaded.arrayBuffer());
    const signature = new TextDecoder().decode(bytes.subarray(0, 5));
    if (signature !== "%PDF-") return json({ error: "The selected file is not a valid PDF." }, 400);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    const filename = uploaded.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "attachment.pdf";
    attachments.push({
      ContentType: "application/pdf",
      Filename: filename,
      Base64Content: btoa(binary),
    });
  }

  if (!env.MAILJET_API_KEY || !env.MAILJET_API_SECRET) {
    return json({ error: "The contact form is not configured yet. Please email info@calab.net." }, 503);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const mail = {
    Messages: [{
      From: { Email: env.CONTACT_FROM_EMAIL || "info@calab.net", Name: "CALAB Contact Form" },
      To: RECIPIENT_EMAILS.map((Email) => ({ Email })),
      ReplyTo: { Email: email, Name: name },
      Subject: `Website contact: ${subject}`,
      TextPart: `From: ${name} <${email}>\n\n${message}`,
      HTMLPart: `<p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p><p><strong>Subject:</strong> ${safeSubject}</p><p>${safeMessage}</p>`,
      ...(attachments.length ? { Attachments: attachments } : {}),
    }, {
      From: { Email: env.CONTACT_FROM_EMAIL || "info@calab.net", Name: "Cellular Architectures Laboratory" },
      To: [{ Email: email, Name: name }],
      ReplyTo: { Email: env.CONTACT_FROM_EMAIL || "info@calab.net", Name: "Cellular Architectures Laboratory" },
      Subject: "CAL - Confirmation Receipt",
      TextPart: `Hello ${name},\n\nThank you for contacting the Cellular Architectures Laboratory. We received your message about: ${subject}. A member of our team will follow up with you.\n\nCellular Architectures Laboratory\nTexas A&M University\ninfo@calab.net`,
      HTMLPart: `<p>Hello ${safeName},</p><p>Thank you for contacting the Cellular Architectures Laboratory. We received your message about <strong>${safeSubject}</strong>. A member of our team will follow up with you.</p><p>Cellular Architectures Laboratory<br>Texas A&amp;M University<br><a href="mailto:info@calab.net">info@calab.net</a></p>`,
    }],
  };

  let mailjetResponse;
  try {
    mailjetResponse = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${env.MAILJET_API_KEY}:${env.MAILJET_API_SECRET}`)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(mail),
    });
  } catch {
    return json({ error: "Mail delivery is temporarily unavailable. Please try again later." }, 502);
  }

  let mailjetResult;
  try {
    mailjetResult = await mailjetResponse.json();
  } catch {
    return json({ error: "Mail delivery failed. Please try again later or email info@calab.net." }, 502);
  }
  if (!mailjetResponse.ok || !Array.isArray(mailjetResult.Messages) || mailjetResult.Messages.length !== 2 || mailjetResult.Messages.some((result) => result.Status !== "success")) {
    return json({ error: "Mail delivery failed. Please try again later or email info@calab.net." }, 502);
  }
  return json({ ok: true });
}

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, 405);
}
