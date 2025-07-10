import { db } from "~/server/db";

export function interpolateRate(
	lower: { rate: number; weight_slab: number },
	upper: { rate: number; weight_slab: number },
	packageWeight: number,
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

		if (lower && upper) {
			const interpolated = interpolateRate(
				{ rate: lower.rate, weight_slab: lower.weight_slab },
				{ rate: upper.rate, weight_slab: upper.weight_slab },
				packageWeight,
			);
			return interpolated;
		}
		if (lower) {
			const calculated = (lower.rate / lower.weight_slab) * packageWeight;
			return calculated;
		}

		return findRate({
			zoneFrom,
			zoneTo,
			weightSlab,
			packageWeight,
			isUserRate: false,
		});
	}
	const exactRate = await db.defaultRate.findFirst({
		where: { zone_from: zoneFrom, zone_to: zoneTo, weight_slab: weightSlab },
	});
	console.log(exactRate);
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

	if (lower && upper) {
		const interpolated = interpolateRate(
			{ rate: lower.rate, weight_slab: lower.weight_slab },
			{ rate: upper.rate, weight_slab: upper.weight_slab },
			packageWeight,
		);
		return interpolated;
	}
	if (lower) {
		const calculated = (lower.rate / lower.weight_slab) * packageWeight;
		return calculated;
	}

	return null;
}

export async function findBulkRates({
	userId,
	shipmentDetails,
	isUserRate,
}: {
	userId?: string;
	shipmentDetails: {
		zoneFrom: string;
		zoneTo: string;
		weightSlab: number;
		packageWeight: number;
	}[];
	isUserRate: boolean;
}) {
	const uniqueRateKeys = new Set<string>();
	for (const detail of shipmentDetails) {
		uniqueRateKeys.add(
			`${detail.zoneFrom}-${detail.zoneTo}-${detail.weightSlab}`,
		);
	}

	const rateLookups = Array.from(uniqueRateKeys).map((key) => {
		const [zoneFrom, zoneTo, weightSlabStr] = key.split("-") as [
			string,
			string,
			string,
		];
		const weightSlab = Number.parseFloat(weightSlabStr);
		return { zoneFrom, zoneTo, weightSlab };
	});

	const ratesMap = new Map<
		string,
		{ rate: number; weight_slab: number; zone_from: string; zone_to: string }
	>();

	if (isUserRate && userId) {
		const userRates = await db.userRate.findMany({
			where: {
				user_id: userId,
				OR: rateLookups.map((lookup) => ({
					zone_from: lookup.zoneFrom,
					zone_to: lookup.zoneTo,
					weight_slab: lookup.weightSlab,
				})),
			},
		});
		for (const rate of userRates) {
			ratesMap.set(`${rate.zone_from}-${rate.zone_to}-${rate.weight_slab}`, {
				...rate,
				zone_from: rate.zone_from,
				zone_to: rate.zone_to,
			});
		}
	}

	const defaultRates = await db.defaultRate.findMany({
		where: {
			OR: rateLookups.map((lookup) => ({
				zone_from: lookup.zoneFrom,
				zone_to: lookup.zoneTo,
				weight_slab: lookup.weightSlab,
			})),
		},
	});
	for (const rate of defaultRates) {
		// Prioritize user rates if they exist
		const key = `${rate.zone_from}-${rate.zone_to}-${rate.weight_slab}`;
		if (!ratesMap.has(key)) {
			ratesMap.set(key, {
				...rate,
				zone_from: rate.zone_from,
				zone_to: rate.zone_to,
			});
		}
	}

	const results: (number | null)[] = [];

	for (const detail of shipmentDetails) {
		const key = `${detail.zoneFrom}-${detail.zoneTo}-${detail.weightSlab}`;
		let calculatedRate: number | null = null;

		const exactRate = ratesMap.get(key);
		if (exactRate) {
			calculatedRate = exactRate.rate;
		} else {
			// If exact slab not found, try to find lower and upper for interpolation
			const lowerRates = Array.from(ratesMap.values())
				.filter(
					(r) =>
						r.zone_from === detail.zoneFrom &&
						r.zone_to === detail.zoneTo &&
						r.weight_slab < detail.weightSlab,
				)
				.sort((a, b) => b.weight_slab - a.weight_slab);

			const upperRates = Array.from(ratesMap.values())
				.filter(
					(r) =>
						r.zone_from === detail.zoneFrom &&
						r.zone_to === detail.zoneTo &&
						r.weight_slab > detail.weightSlab,
				)
				.sort((a, b) => a.weight_slab - b.weight_slab);

			const lower = lowerRates.length > 0 ? lowerRates[0] : null;
			const upper = upperRates.length > 0 ? upperRates[0] : null;

			if (lower && upper) {
				calculatedRate = interpolateRate(
					{ rate: lower.rate, weight_slab: lower.weight_slab },
					{ rate: upper.rate, weight_slab: upper.weight_slab },
					detail.packageWeight,
				);
			} else if (lower) {
				calculatedRate =
					(lower.rate / lower.weight_slab) * detail.packageWeight;
			}
		}
		results.push(calculatedRate);
	}

	return results;
}
