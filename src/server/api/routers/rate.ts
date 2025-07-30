import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calculateInsurancePremium } from "~/lib/insurance";
import logger from "~/lib/logger";
import { findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { rateSchema } from "~/schemas/rate";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

export const rateRouter = createTRPCRouter({
	getMyRates: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.user_id;
		const defaultRates = await ctx.db.defaultRate.findMany();
		const userRates = await ctx.db.userRate.findMany({
			where: { user_id: userId },
			select: { rate: true, zone_from: true, zone_to: true, weight_slab: true },
		});

		const userRatesMap = new Map(
			userRates.map((rate) => [
				`${rate.zone_from}-${rate.zone_to}-${rate.weight_slab}`,
				rate,
			]),
		);

		const combinedRates = defaultRates.map((defaultRate) => {
			const key = `${defaultRate.zone_from}-${defaultRate.zone_to}-${defaultRate.weight_slab}`;
			const userRate = userRatesMap.get(key);
			return (
				userRate || {
					...defaultRate,
					default_rate_id: undefined,
					user_rate_id: undefined,
					user_id: userId,
				}
			);
		});

		return combinedRates;
	}),
	calculateRate: publicProcedure
		.input(rateSchema)
		.query(async ({ input, ctx }) => {
			try {
				const { originZipCode, destinationZipCode, packageWeight } = input;

				const originDetails = await getPincodeDetails(originZipCode);
				const destinationDetails = await getPincodeDetails(destinationZipCode);

				if (!originDetails || !destinationDetails) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid origin or destination pincode",
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(packageWeight * 2) / 2;

				if (ctx.user?.user_id) {
					const userRate = await findRate({
						userId: ctx.user.user_id,
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight,
						isUserRate: true,
					});
					if (userRate !== null) {
						const { insurancePremium, compensationAmount } =
							calculateInsurancePremium(
								input.declaredValue ?? userRate,
								input.isInsuranceSelected,
							);
						const finalRate = userRate + insurancePremium;

						return {
							rate: finalRate,
							origin: originDetails,
							destination: destinationDetails,
							insurancePremium,
							compensationAmount,
						};
					}
				}
				const defaultRate = await findRate({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight,
					isUserRate: false,
				});
				if (defaultRate !== null) {
					const { insurancePremium, compensationAmount } =
						calculateInsurancePremium(
							input.declaredValue ?? defaultRate,
							input.isInsuranceSelected,
						);
					const finalRate = defaultRate + insurancePremium;

					return {
						rate: finalRate,
						origin: originDetails,
						destination: destinationDetails,
						insurancePremium,
						compensationAmount,
					};
				}

				logger.error("rate.calculateRate", {
					req: ctx.req,
					user: ctx.user,
					input,
					error: "No rate found",
				});
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rate not found for the given parameters",
				});
			} catch (error) {
				logger.error("rate.calculate", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw error;
			}
		}),

	// calculateBulkRates: protectedProcedure
	// 	.input(
	// 		z.array(
	// 			z.object({
	// 				originZipCode: z.string(),
	// 				destinationZipCode: z.string(),
	// 				packageWeight: z.number(),
	// 				declaredValue: z.number().optional(),
	// 				isInsuranceSelected: z.boolean().optional(),
	// 			}),
	// 		),
	// 	)
	// 	.query(async ({ input, ctx }) => {
	// 		const { user } = ctx;
	// 		const logData = { userId: user?.user_id, inputCount: input.length };
	// 		logger.info("Calculating bulk rates", logData);

	// 		try {
	// 			const shipmentDetailsForRateCalculation: {
	// 				zoneFrom: string;
	// 				zoneTo: string;
	// 				weightSlab: number;
	// 				packageWeight: number;
	// 			}[] = [];

	// 			for (const shipment of input) {
	// 				const originDetails = await getPincodeDetails(shipment.originZipCode);
	// 				const destinationDetails = await getPincodeDetails(
	// 					shipment.destinationZipCode,
	// 				);

	// 				if (!originDetails || !destinationDetails) {
	// 					logger.warn(
	// 						"Invalid origin or destination pincode in bulk request",
	// 						{ ...logData, shipment },
	// 					);
	// 					throw new TRPCError({
	// 						code: "BAD_REQUEST",
	// 						message: "Invalid origin or destination pincode in bulk request",
	// 					});
	// 				}

	// 				const { zone } = getZone(originDetails, destinationDetails);
	// 				const weightSlab = Math.ceil(shipment.packageWeight * 2) / 2;

	// 				shipmentDetailsForRateCalculation.push({
	// 					zoneFrom: "z",
	// 					zoneTo: zone,
	// 					weightSlab,
	// 					packageWeight: shipment.packageWeight,
	// 				});
	// 			}

	// 			const rates = await findBulkRates({
	// 				userId: user?.user_id,
	// 				shipmentDetails: shipmentDetailsForRateCalculation,
	// 				isUserRate: !!user?.user_id,
	// 			});

	// 			const results = rates.map((rate, index) => {
	// 				if (rate === null) {
	// 					return { rate: null, insurancePremium: 0 };
	// 				}

	// 				const shipment = input[index];
	// 				if (!shipment) {
	// 					return { rate: null, insurancePremium: 0 };
	// 				}
	// 				const { insurancePremium } = calculateInsurancePremium(
	// 					shipment.declaredValue ?? rate,
	// 					shipment.isInsuranceSelected,
	// 				);

	// 				return { rate: rate + insurancePremium, insurancePremium };
	// 			});

	// 			logger.info("Successfully calculated bulk rates", {
	// 				...logData,
	// 				rateCount: results.length,
	// 			});
	// 			return results;
	// 		} catch (error) {
	// 			logger.error("Failed to calculate bulk rates", { ...logData, error });
	// 			throw error;
	// 		}
	// 	}),

	getDefaultRates: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.defaultRate.findMany();
	}),

	updateDefaultRate: adminProcedure
		.input(z.object({ id: z.string(), rate: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id, rate } = input;
			return ctx.db.defaultRate.update({
				where: { default_rate_id: id },
				data: { rate: rate },
			});
		}),

	getUserRates: adminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = input;
			const defaultRates = await ctx.db.defaultRate.findMany();
			const userRates = await ctx.db.userRate.findMany({
				where: { user_id: userId },
			});

			const userRatesMap = new Map(
				userRates.map((rate) => [
					`${rate.zone_from}-${rate.zone_to}-${rate.weight_slab}`,
					rate,
				]),
			);

			const combinedRates = defaultRates.map((defaultRate) => {
				const key = `${defaultRate.zone_from}-${defaultRate.zone_to}-${defaultRate.weight_slab}`;
				const userRate = userRatesMap.get(key);
				return (
					userRate || {
						...defaultRate,
						default_rate_id: undefined,
						user_rate_id: undefined,
						user_id: userId,
					}
				);
			});

			return combinedRates;
		}),

	updateUserRate: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				zone_from: z.string(),
				zone_to: z.string(),
				weight_slab: z.number(),
				rate: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId, zone_from, zone_to, weight_slab, rate } = input;
			return ctx.db.userRate.upsert({
				where: {
					user_id_zone_from_zone_to_weight_slab: {
						user_id: userId,
						zone_from: zone_from,
						zone_to: zone_to,
						weight_slab: weight_slab,
					},
				},
				update: { rate: rate },
				create: {
					user_id: userId,
					zone_from: zone_from,
					zone_to: zone_to,
					weight_slab: weight_slab,
					rate: rate,
				},
			});
		}),
});
