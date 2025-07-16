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

  // Mandatory Protection for actualRate > 25000
  if (actualRate > 25000 && !isInsuranceSelected) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Insurance is mandatory for shipments with actual rate above ₹25,000.",
    });
  }

  // Mandatory Insurance Check for actualRate > 5000
  if (actualRate > 5000 && !isInsuranceSelected) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Insurance is mandatory for shipments with actual rate above ₹5,000.",
    });
  }

  if (isInsuranceSelected) {
    if (declaredValue !== undefined && declaredValue > 0) {
      if (declaredValue >= 1 && declaredValue <= 2499) {
        insurancePremium = 100;
        compensationAmount = declaredValue; // 100% of declared value
      } else if (declaredValue >= 2500 && declaredValue <= 5000) {
        insurancePremium = 100;
        compensationAmount = declaredValue * 0.8; // 80% of declared value
      } else if (declaredValue > 5000) {
        // If declaredValue is provided and > 5000, use actualRate tiers for premium/compensation
        if (actualRate >= 5001 && actualRate <= 12999) {
          insurancePremium = actualRate * 0.02; // 2% of actual rate
          compensationAmount = actualRate * 0.8; // 80% of actual rate
        } else if (actualRate >= 13000 && actualRate <= 21999) {
          // Linearly increasing premium and coverage
          const premiumPercentage = 0.021 + (0.029 - 0.021) * ((actualRate - 13000) / (21999 - 13000));
          const coveragePercentage = 0.58 + (0.78 - 0.58) * ((actualRate - 13000) / (21999 - 13000));
          insurancePremium = actualRate * premiumPercentage;
          compensationAmount = actualRate * coveragePercentage;
        } else if (actualRate >= 22000 && actualRate <= 26999) {
          // Linearly increasing coverage
          insurancePremium = actualRate * 0.03; // 3%
          const coveragePercentage = 0.51 + (0.55 - 0.51) * ((actualRate - 22000) / (26999 - 22000));
          compensationAmount = actualRate * coveragePercentage;
        } else if (actualRate >= 27000 && actualRate <= 49999) {
          insurancePremium = actualRate * 0.03; // 3% of actual rate
          compensationAmount = actualRate * 0.5; // 50% of actual rate
        }
      }
    } else {
      // If declaredValue is not provided or 0, use actualRate tiers for premium/compensation
      if (actualRate >= 5001 && actualRate <= 12999) {
        insurancePremium = actualRate * 0.02; // 2% of actual rate
        compensationAmount = actualRate * 0.8; // 80% of actual rate
      } else if (actualRate >= 13000 && actualRate <= 21999) {
        // Linearly increasing premium and coverage
        const premiumPercentage = 0.021 + (0.029 - 0.021) * ((actualRate - 13000) / (21999 - 13000));
        const coveragePercentage = 0.58 + (0.78 - 0.58) * ((actualRate - 13000) / (21999 - 13000));
        insurancePremium = actualRate * premiumPercentage;
        compensationAmount = actualRate * coveragePercentage;
      } else if (actualRate >= 22000 && actualRate <= 26999) {
        // Linearly increasing coverage
        insurancePremium = actualRate * 0.03; // 3%
        const coveragePercentage = 0.51 + (0.55 - 0.51) * ((actualRate - 22000) / (26999 - 22000));
        compensationAmount = actualRate * coveragePercentage;
      } else if (actualRate >= 27000 && actualRate <= 49999) {
        insurancePremium = actualRate * 0.03; // 3% of actual rate
        compensationAmount = actualRate * 0.5; // 50% of actual rate
      }
    }
  }

  return { insurancePremium, compensationAmount };
}
