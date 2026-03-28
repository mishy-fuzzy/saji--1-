import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const secure = toBool(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "no-reply@saji.app";

  if (!host || !port || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.",
    );
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    from,
  };
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const config = getSmtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return cachedTransporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const config = getSmtpConfig();
  const transporter = getTransporter();

  const result = await transporter.sendMail({
    from: config.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  };
}
