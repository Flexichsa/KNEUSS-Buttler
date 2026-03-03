import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  appUrl: string
): Promise<void> {
  const resetLink = `${appUrl}/forgot-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Passwort zurücksetzen — KNEUSS Digital Assistant",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 16px;">Passwort zurücksetzen</h2>
        <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
        <p>Klicken Sie auf den folgenden Link, um ein neues Passwort zu vergeben:</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}"
             style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Passwort zurücksetzen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
          Der Link ist 1 Stunde gültig.
        </p>
      </div>
    `,
  });
}
