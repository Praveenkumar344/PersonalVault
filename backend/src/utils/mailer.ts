// backend/src/utils/mailer.ts
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
  // allow local dev to still run but warn
  console.warn("MAILER: EMAIL_HOST/EMAIL_USER not set — verification emails won't send.");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: +(process.env.EMAIL_PORT ||587),
  secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
      <h2>Verify your email</h2>
      <p>Click the link below to verify your Secure Personal Vault account. This link expires in 15 minutes.</p>
      <a href="${verifyLink}" style="display:inline-block;padding:10px 14px;border-radius:6px;background:#0f172a;color:#fff;text-decoration:none;">Verify Email</a>
      <p style="color:#666;font-size:14px;margin-top:12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"PersonalVault" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your PersonalVault account",
    html,
  });
}

export async function sendVerificationEmailChangepass(to: string, token: string, html:string) {

  await transporter.sendMail({
    from: `"PersonalVault" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your PersonalVault account",
    html,
  });
}
