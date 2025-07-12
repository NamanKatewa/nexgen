import logger from "~/lib/logger";
import { db } from "~/server/db";

export function interpolateRate(
	lower: { rate: number; weight_slab: number },
	upper: { rate: number; weight_slab: number },
	packageWeight: number,
): number {
	const rateDiff = upper.rate - lower.rate;
	const weightDiff = upper.weight_slab - lower.weight_slab;

	if (weightDiff <= 0) {
		const calculatedRate = (lower.rate / lower.weight_slab) * packageWeight;
		logger.info("Interpolating rate with only lower bound", {
			lower,
			packageWeight,
			calculatedRate,
		});
		return calculatedRate;
	}

	const ratePerKgInRange = rateDiff / weightDiff;
	const weightAboveLower = packageWeight - lower.weight_slab;
	const calculatedRate = lower.rate + weightAboveLower * ratePerKgInRange;
	logger.info("Interpolating rate", {
		lower,
		upper,
		packageWeight,
		calculatedRate,
	});
	return calculatedRate;
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
	const logData = {
		userId,
		zoneFrom,
		zoneTo,
		weightSlab,
		packageWeight,
		isUserRate,
	};
	logger.info("Finding rate", logData);

	try {
		if (isUserRate && userId) {
			const exactRate = await db.userRate.findFirst({
				where: {
					user_id: userId,
					zone_from: zoneFrom,
					zone_to: zoneTo,
					weight_slab: weightSlab,
				},
			});
			if (exactRate) {
				logger.info("Found exact user rate", {
					...logData,
					rate: exactRate.rate,
				});
				return exactRate.rate;
			}

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
				logger.info("Interpolated user rate", {
					...logData,
					rate: interpolated,
				});
				return interpolated;
			}
			if (lower) {
				const calculated = (lower.rate / lower.weight_slab) * packageWeight;
				logger.info("Calculated user rate from lower bound", {
					...logData,
					rate: calculated,
				});
				return calculated;
			}

			logger.info("User rate not found, falling back to default rate", logData);
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
		if (exactRate) {
			logger.info("Found exact default rate", {
				...logData,
				rate: exactRate.rate,
			});
			return exactRate.rate;
		}

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
			logger.info("Interpolated default rate", {
				...logData,
				rate: interpolated,
			});
			return interpolated;
		}
		if (lower) {
			const calculated = (lower.rate / lower.weight_slab) * packageWeight;
			logger.info("Calculated default rate from lower bound", {
				...logData,
				rate: calculated,
			});
			return calculated;
		}

		logger.warn("Rate not found", logData);
		return null;
	} catch (error) {
		logger.error("Error finding rate", { ...logData, error });
		throw error;
	}
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
	const logData = { userId, shipmentDetails, isUserRate };
	logger.info("Finding bulk rates", logData);

	try {
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
			logger.info("Fetched user rates for bulk calculation", {
				...logData,
				userRates: userRates.length,
			});
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
		logger.info("Fetched default rates for bulk calculation", {
			...logData,
			defaultRates: defaultRates.length,
		});

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

		logger.info("Bulk rates calculated successfully", { ...logData, results });
		return results;
	} catch (error) {
		logger.error("Error finding bulk rates", { ...logData, error });
		throw error;
	}
}
