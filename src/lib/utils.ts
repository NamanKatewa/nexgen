import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import logger from "~/lib/logger";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateOTP(): string {
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	logger.info("Generated OTP", { otp });
	return otp;
}

export function generateShipmentId(userId: string | undefined): string {
	const prefix = "NEX";

	const timePart = Date.now().toString().slice(-4);

	const userPart = userId?.slice(-2).toUpperCase();

	const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase();

	const shipmentId = `${prefix}${timePart}${userPart}${randomPart}`;
	logger.info("Generated shipment ID", { userId, shipmentId });
	return shipmentId;
}

export function formatDate(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	const datePart = new Intl.DateTimeFormat("en-US", options).format(date);

	const hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? "PM" : "AM";
	const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
	const timePart = `${formattedHours}:${formattedMinutes} ${ampm}`;

	return `${datePart} ${timePart}`;
}

export async function imageUrlToBase64(url: string): Promise<string> {
	const response = await fetch(url);
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
