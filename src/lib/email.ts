import nodemailer from "nodemailer";
import { env } from "~/env";

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
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}
