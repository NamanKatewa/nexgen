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
