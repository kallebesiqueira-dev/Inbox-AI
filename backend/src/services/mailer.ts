import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const configurato = Boolean(env.GMAIL_APP_USER && env.GMAIL_APP_PASSWORD);

const transporter = configurato
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.GMAIL_APP_USER, pass: env.GMAIL_APP_PASSWORD },
    })
  : null;

/**
 * Invia un'email di sistema (es. reset password) via SMTP Gmail.
 * Se l'SMTP non è configurato non invia nulla (e non blocca il flusso).
 */
export async function inviaEmailSistema(
  a: string,
  oggetto: string,
  html: string
): Promise<boolean> {
  if (!transporter) {
    console.warn(
      "[Mailer] SMTP non configurato (GMAIL_APP_USER/GMAIL_APP_PASSWORD): email non inviata."
    );
    return false;
  }
  try {
    await transporter.sendMail({
      from: `Inbox AI <${env.GMAIL_APP_USER}>`,
      to: a,
      subject: oggetto,
      html,
    });
    return true;
  } catch (err) {
    console.error("[Mailer] invio fallito:", err);
    return false;
  }
}
