import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

export function generateOTP(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}
