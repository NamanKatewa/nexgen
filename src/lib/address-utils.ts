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
	const pincodeDetails = await getPincodeDetails(zipCode);
	if (!pincodeDetails) {
		return false;
	}
	const isAllowed = isAllowedState(pincodeDetails.state);
	return isAllowed;
}
