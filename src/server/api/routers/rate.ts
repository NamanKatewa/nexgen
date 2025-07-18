import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calculateInsurancePremium } from "~/lib/insurance";
import logger from "~/lib/logger";
import { findBulkRates, findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { rateSchema } from "~/schemas/rate";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

export const rateRouter = createTRPCRouter({
	calculateRate: publicProcedure
		.input(rateSchema)
		.query(async ({ input, ctx }) => {
			const { user } = ctx;
			const logData = { userId: user?.user_id, input };
			logger.info("Calculating rate", logData);

			try {
				const { originZipCode, destinationZipCode, packageWeight } = input;

				const originDetails = await getPincodeDetails(originZipCode);
				const destinationDetails = await getPincodeDetails(destinationZipCode);

				if (!originDetails || !destinationDetails) {
					logger.warn("Invalid origin or destination pincode", { ...logData });
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid origin or destination pincode",
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(packageWeight * 2) / 2;

				if (user?.user_id) {
					logger.info("Attempting to find user-specific rate", { ...logData });
					const userRate = await findRate({
						userId: user.user_id,
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight,
						isUserRate: true,
					});
					if (userRate !== null) {
						logger.info("Found user-specific rate", {
							...logData,
							rate: userRate,
							source: "user",
						});
						const { insurancePremium, compensationAmount } =
							calculateInsurancePremium(userRate, input.isInsuranceSelected);
						const finalRate = userRate + insurancePremium;
						logger.info("Found user-specific rate", {
							...logData,
							rate: finalRate,
							source: "user",
						});
						return {
							rate: finalRate,
							origin: originDetails,
							destination: destinationDetails,
							insurancePremium,
							compensationAmount,
						};
					}
					logger.info(
						"User-specific rate not found, falling back to default rate",
						{ ...logData },
					);
				}

				logger.info("Attempting to find default rate", { ...logData });
				const defaultRate = await findRate({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight,
					isUserRate: false,
				});
				if (defaultRate !== null) {
					const { insurancePremium, compensationAmount } =
						calculateInsurancePremium(defaultRate, input.isInsuranceSelected);
					const finalRate = defaultRate + insurancePremium;
					logger.info("Found default rate", {
						...logData,
						rate: finalRate,
						source: "default",
					});
					return {
						rate: finalRate,
						origin: originDetails,
						destination: destinationDetails,
						insurancePremium,
						compensationAmount,
					};
				}

				logger.error("No rate found (user or default)", { ...logData });
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rate not found for the given parameters",
				});
			} catch (error) {
				logger.error("Failed to calculate rate", { ...logData, error });
				throw error;
			}
		}),

	calculateBulkRates: protectedProcedure
		.input(
			z.array(
				z.object({
					originZipCode: z.string(),
					destinationZipCode: z.string(),
					packageWeight: z.number(),
					declaredValue: z.number().optional(),
					isInsuranceSelected: z.boolean().optional(),
				}),
			),
		)
		.query(async ({ input, ctx }) => {
			const { user } = ctx;
			const logData = { userId: user?.user_id, inputCount: input.length };
			logger.info("Calculating bulk rates", logData);

			try {
				const shipmentDetailsForRateCalculation: {
					zoneFrom: string;
					zoneTo: string;
					weightSlab: number;
					packageWeight: number;
				}[] = [];

				for (const shipment of input) {
					const originDetails = await getPincodeDetails(shipment.originZipCode);
					const destinationDetails = await getPincodeDetails(
						shipment.destinationZipCode,
					);

					if (!originDetails || !destinationDetails) {
						logger.warn(
							"Invalid origin or destination pincode in bulk request",
							{ ...logData, shipment },
						);
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid origin or destination pincode in bulk request",
						});
					}

					const { zone } = getZone(originDetails, destinationDetails);
					const weightSlab = Math.ceil(shipment.packageWeight * 2) / 2;

					shipmentDetailsForRateCalculation.push({
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight: shipment.packageWeight,
					});
				}

				const rates = await findBulkRates({
					userId: user?.user_id,
					shipmentDetails: shipmentDetailsForRateCalculation,
					isUserRate: !!user?.user_id,
				});

				const results = rates.map((rate, index) => {
					if (rate === null) {
						return { rate: null, insurancePremium: 0 };
					}

					const shipment = input[index];
					const { insurancePremium } = calculateInsurancePremium(
						rate,
						shipment?.isInsuranceSelected,
					);

					return { rate: rate + insurancePremium, insurancePremium };
				});

				logger.info("Successfully calculated bulk rates", {
					...logData,
					rateCount: results.length,
				});
				return results;
			} catch (error) {
				logger.error("Failed to calculate bulk rates", { ...logData, error });
				throw error;
			}
		}),
});
