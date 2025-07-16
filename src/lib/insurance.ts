import { TRPCError } from "@trpc/server";

export function calculateInsurancePremium(
	actualRate: number,
	declaredValue?: number,
	isInsuranceSelected?: boolean,
): { insurancePremium: number; compensationAmount: number } {
	let insurancePremium = 0;
	let compensationAmount = 0;

	// Shipment Value Limit
	if (actualRate > 49999) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Shipments over ₹49,999 are not accepted.",
		});
	}

	// Mandatory Insurance Check for actualRate > 5000
	if (actualRate > 5000 && !isInsuranceSelected) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Insurance is mandatory for shipments with actual rate above ₹5,000.",
		});
	}

	if (isInsuranceSelected) {
		if (actualRate >= 1 && actualRate <= 2499) {
			insurancePremium = 100;
			compensationAmount = actualRate; // 100% of actual rate
		} else if (actualRate >= 2500 && actualRate <= 5000) {
			insurancePremium = 100;
			compensationAmount = actualRate * 0.8; // 80% of actual rate
		} else if (actualRate >= 5001 && actualRate <= 12999) {
			insurancePremium = actualRate * 0.02; // 2% of actual rate
			compensationAmount = actualRate * 0.8; // 80% of actual rate
		} else if (actualRate >= 13000 && actualRate <= 21999) {
			// Linearly increasing premium and coverage
			const premiumPercentage =
				0.021 + (0.029 - 0.021) * ((actualRate - 13000) / (21999 - 13000));
			const coveragePercentage =
				0.58 + (0.78 - 0.58) * ((actualRate - 13000) / (21999 - 13000));
			insurancePremium = actualRate * premiumPercentage;
			compensationAmount = actualRate * coveragePercentage;
		} else if (actualRate >= 22000 && actualRate <= 26999) {
			// Linearly increasing coverage
			insurancePremium = actualRate * 0.03; // 3%
			const coveragePercentage =
				0.51 + (0.55 - 0.51) * ((actualRate - 22000) / (26999 - 22000));
			compensationAmount = actualRate * coveragePercentage;
		} else if (actualRate >= 27000 && actualRate <= 49999) {
			insurancePremium = actualRate * 0.03; // 3% of actual rate
			compensationAmount = actualRate * 0.5; // 50% of actual rate
		}
	}

	return { insurancePremium, compensationAmount };
}
