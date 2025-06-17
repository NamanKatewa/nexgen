import nodemailer from "nodemailer";
import { env } from "~/env";

// Create transporter once
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
}): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Nexgen Courier Services" <${env.EMAIL_USER}>`, // More reliable
      to,
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email sending failed:", (error as Error).message);
    return false;
  }
}
