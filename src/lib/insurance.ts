import { TRPCError } from "@trpc/server";

export function calculateInsurancePremium(
	declaredValue: number,
	isInsuranceSelected?: boolean,
): { insurancePremium: number; compensationAmount: number } {
	let insurancePremium = 0;
	let compensationAmount = 0;

	// Shipment Value Limit
	if (declaredValue > 49999) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Shipments over ₹49,999 are not accepted.",
		});
	}

	// Mandatory Insurance Check for declaredValue > 5000
	if (declaredValue > 25000 && !isInsuranceSelected) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Insurance is mandatory for shipments with actual rate above ₹25,000.",
		});
	}

	if (isInsuranceSelected) {
		if (declaredValue >= 1 && declaredValue <= 2499) {
			insurancePremium = 100;
			compensationAmount = declaredValue; // 100% of declaredValue
		} else if (declaredValue >= 2500 && declaredValue <= 5000) {
			insurancePremium = 100;
			compensationAmount = declaredValue * 0.8; // 80% of declaredValue
		} else if (declaredValue >= 5001 && declaredValue <= 12999) {
			insurancePremium = declaredValue * 0.02; // 2% of declaredValue
			compensationAmount = declaredValue * 0.8; // 80% of declaredValue
		} else if (declaredValue >= 13000 && declaredValue <= 21999) {
			// Linearly increasing premium and coverage
			const premiumPercentage =
				0.021 + (0.029 - 0.021) * ((declaredValue - 13000) / (21999 - 13000));
			const coveragePercentage =
				0.58 + (0.78 - 0.58) * ((declaredValue - 13000) / (21999 - 13000));
			insurancePremium = declaredValue * premiumPercentage;
			compensationAmount = declaredValue * coveragePercentage;
		} else if (declaredValue >= 22000 && declaredValue <= 26999) {
			// Linearly increasing coverage
			insurancePremium = declaredValue * 0.03; // 3%
			const coveragePercentage =
				0.51 + (0.55 - 0.51) * ((declaredValue - 22000) / (26999 - 22000));
			compensationAmount = declaredValue * coveragePercentage;
		} else if (declaredValue >= 27000 && declaredValue <= 49999) {
			insurancePremium = declaredValue * 0.03; // 3% of declaredValue
			compensationAmount = declaredValue * 0.5; // 50% of declaredValue
		}
	}

	return { insurancePremium, compensationAmount };
}
