import logger from "~/lib/logger";
import { getPincodeDetails } from "~/lib/rate-calculator";

const ALLOWED_STATES = [
	"DELHI",
	"UTTAR PRADESH",
	"HARYANA",
	"BIHAR",
	"WEST BENGAL",
];

export function isAllowedState(state: string): boolean {
	return ALLOWED_STATES.includes(state.toUpperCase());
}

export async function validateAddressForPickup(
	zipCode: string,
): Promise<boolean> {
	const logData = { zipCode };
	logger.info("Validating address for pickup", logData);

	const pincodeDetails = await getPincodeDetails(zipCode);

	if (!pincodeDetails) {
		logger.warn("Pincode details not found for validation", logData);
		return false; // Pincode not found, so not serviceable
	}

	const isAllowed = isAllowedState(pincodeDetails.state);

	if (!isAllowed) {
		logger.warn("Pickup from state not allowed", {
			...logData,
			canonicalState: pincodeDetails.state,
		});
	}

	return isAllowed;
}
