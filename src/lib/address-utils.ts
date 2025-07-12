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
	pincode: string,
	state: string,
): Promise<boolean> {
	const details = await getPincodeDetails(pincode);

	if (!details) {
		logger.warn("Pincode not found during address validation", {
			pincode,
			state,
		});
		return false; // Pincode not found
	}

	// Check if the state from the pincode matches the provided state and is in the allowed list
	const normalizedDetailsState = details.state.toUpperCase();
	const normalizedInputState = state.toUpperCase();

	const isStateMatch = normalizedDetailsState === normalizedInputState;
	const isAllowed = isAllowedState(state);

	const isValid = isStateMatch && isAllowed;

	if (!isValid) {
		logger.warn("Address validation failed for pickup", {
			pincode,
			inputState: state,
			foundState: details.state,
			normalizedInputState,
			normalizedFoundState: normalizedDetailsState,
			isStateMatch,
			isAllowed,
		});
	}

	return isValid;
}
