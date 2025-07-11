import nodemailer from "nodemailer";
import { env } from "~/env";
import logger from "~/lib/logger";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: "Nexgen Courier Services",
      to,
      subject,
      text,
      html,
    });
    logger.info("Email sent successfully", { to, subject });
    return true;
  } catch (error) {
    logger.error("Error sending email", { error, to, subject });
    throw new Error("Failed to send email");
  }
}
