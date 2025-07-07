import { db } from "~/server/db";

export function interpolateRate(
  lower: { rate: number; weight_slab: number },
  upper: { rate: number; weight_slab: number },
  packageWeight: number
): number {
  const rateDiff = upper.rate - lower.rate;
  const weightDiff = upper.weight_slab - lower.weight_slab;

  if (weightDiff <= 0) {
    return (lower.rate / lower.weight_slab) * packageWeight;
  }

  const ratePerKgInRange = rateDiff / weightDiff;
  const weightAboveLower = packageWeight - lower.weight_slab;
  return lower.rate + weightAboveLower * ratePerKgInRange;
}

export async function findRate({
  userId,
  zoneFrom,
  zoneTo,
  weightSlab,
  packageWeight,
  isUserRate,
}: {
  userId?: string;
  zoneFrom: string;
  zoneTo: string;
  weightSlab: number;
  packageWeight: number;
  isUserRate: boolean;
}) {
  if (isUserRate && userId) {
    const exactRate = await db.userRate.findFirst({
      where: {
        user_id: userId,
        zone_from: zoneFrom,
        zone_to: zoneTo,
        weight_slab: weightSlab,
      },
    });
    if (exactRate) return exactRate.rate;

    const [lower, upper] = await Promise.all([
      db.userRate.findFirst({
        where: {
          user_id: userId,
          zone_from: zoneFrom,
          zone_to: zoneTo,
          weight_slab: { lt: weightSlab },
        },
        orderBy: { weight_slab: "desc" },
      }),
      db.userRate.findFirst({
        where: {
          user_id: userId,
          zone_from: zoneFrom,
          zone_to: zoneTo,
          weight_slab: { gt: weightSlab },
        },
        orderBy: { weight_slab: "asc" },
      }),
    ]);

    if (lower && upper) return interpolateRate(lower, upper, packageWeight);
    if (lower) return (lower.rate / lower.weight_slab) * packageWeight;
  } else {
    const exactRate = await db.defaultRate.findFirst({
      where: { zone_from: zoneFrom, zone_to: zoneTo, weight_slab: weightSlab },
    });
    if (exactRate) return exactRate.rate;

    const [lower, upper] = await Promise.all([
      db.defaultRate.findFirst({
        where: {
          zone_from: zoneFrom,
          zone_to: zoneTo,
          weight_slab: { lt: weightSlab },
        },
        orderBy: { weight_slab: "desc" },
      }),
      db.defaultRate.findFirst({
        where: {
          zone_from: zoneFrom,
          zone_to: zoneTo,
          weight_slab: { gt: weightSlab },
        },
        orderBy: { weight_slab: "asc" },
      }),
    ]);

    if (lower && upper) return interpolateRate(lower, upper, packageWeight);
    if (lower) return (lower.rate / lower.weight_slab) * packageWeight;
  }

  return null;
}
