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

export function formatDateToSeconds(date: Date): string {
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

export function convertOklchToRgb(oklchString: string): string {
	const oklchRegex =
		/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/g;

	return oklchString.replace(
		oklchRegex,
		(match, lightness, chroma, hue, alpha) => {
			const l = Number.parseFloat(lightness);
			const a = alpha !== undefined ? Number.parseFloat(alpha) : 1;

			// Simple grayscale approximation
			const rgbValue = Math.round(Math.min(Math.max(l, 0), 1) * 255);

			return a !== 1
				? `rgba(${rgbValue}, ${rgbValue}, ${rgbValue}, ${a})`
				: `rgb(${rgbValue}, ${rgbValue}, ${rgbValue})`;
		},
	);
}

export function applyOklchFallback(element: HTMLElement) {
	if (!element || typeof window === "undefined") return;

	// Get all elements including the root element
	const allElements = [element, ...element.querySelectorAll("*")];

	for (const el of allElements) {
		if (!(el instanceof HTMLElement)) continue;

		// Check computed styles
		const computedStyle = window.getComputedStyle(el);

		// Process all computed style properties
		for (let i = 0; i < computedStyle.length; i++) {
			const propName = computedStyle[i];
			if (propName) {
				const propValue = computedStyle.getPropertyValue(propName);
				if (propValue?.includes("oklch(")) {
					const fallback = convertOklchToRgb(propValue);
					if (fallback !== propValue) {
						el.style.setProperty(propName, fallback, "important");
					}
				}
			}
		}

		// Also check inline styles
		if (el.style) {
			for (let i = 0; i < el.style.length; i++) {
				const propName = el.style[i];
				if (propName) {
					const propValue = el.style.getPropertyValue(propName);
					if (propValue?.includes("oklch(")) {
						const fallback = convertOklchToRgb(propValue);
						if (fallback !== propValue) {
							el.style.setProperty(propName, fallback, "important");
						}
					}
				}
			}
		}
	}
}

// Additional function to completely remove OKLCH from DOM
export function removeOklchFromDOM(element: HTMLElement) {
	if (!element || typeof window === "undefined") return;

	// Create a comprehensive style override
	const styleId = `oklch-override-${Date.now()}`;
	const style = document.createElement("style");
	style.id = styleId;

	// Override all possible OKLCH uses with solid fallbacks
	style.textContent = `
    .shipment-label, .shipment-label * {
      color: #000000 !important;
      background-color: #ffffff !important;
      border-color: #000000 !important;
      fill: #000000 !important;
      stroke: #000000 !important;
    }
    
    .shipment-label .font-bold[style*="color"] {
      color: #dc2626 !important;
    }
    
    /* Override all CSS custom properties with RGB values */
    .shipment-label {
      --background: rgb(255, 255, 255) !important;
      --foreground: rgb(0, 0, 0) !important;
      --card: rgb(255, 255, 255) !important;
      --card-foreground: rgb(0, 0, 0) !important;
      --popover: rgb(255, 255, 255) !important;
      --popover-foreground: rgb(0, 0, 0) !important;
      --primary: rgb(0, 0, 0) !important;
      --primary-foreground: rgb(255, 255, 255) !important;
      --secondary: rgb(247, 247, 247) !important;
      --secondary-foreground: rgb(0, 0, 0) !important;
      --muted: rgb(247, 247, 247) !important;
      --muted-foreground: rgb(113, 113, 122) !important;
      --accent: rgb(247, 247, 247) !important;
      --accent-foreground: rgb(0, 0, 0) !important;
      --destructive: rgb(239, 68, 68) !important;
      --border: rgb(229, 229, 229) !important;
      --input: rgb(229, 229, 229) !important;
      --ring: rgb(147, 197, 253) !important;
    }
  `;

	document.head.appendChild(style);

	// Return cleanup function
	return () => {
		const styleElement = document.getElementById(styleId);
		if (styleElement) {
			document.head.removeChild(styleElement);
		}
	};
}
