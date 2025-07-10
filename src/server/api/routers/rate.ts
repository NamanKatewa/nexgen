import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { findBulkRates, findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { rateSchema } from "~/schemas/rate";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const rateRouter = createTRPCRouter({
	calculateRate: publicProcedure
		.input(rateSchema)
		.query(async ({ input, ctx }) => {
			const { originZipCode, destinationZipCode, packageWeight } = input;
			const userId = ctx.user?.user_id;

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

			if (userId) {
				const userRate = await findRate({
					userId,
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight,
					isUserRate: true,
				});
				if (userRate !== null) {
					return {
						rate: userRate,
						origin: originDetails,
						destination: destinationDetails,
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
				return {
					rate: defaultRate,
					origin: originDetails,
					destination: destinationDetails,
				};
			}

			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Rate not found for the given parameters",
			});
		}),

	calculateBulkRates: publicProcedure
		.input(
			z.array(
				z.object({
					originZipCode: z.string(),
					destinationZipCode: z.string(),
					packageWeight: z.number(),
				}),
			),
		)
		.query(async ({ input, ctx }) => {
			const userId = ctx.user?.user_id;
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
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid origin or destination pincode in bulk request",
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(shipment.packageWeight * 2) / 2;

				shipmentDetailsForRateCalculation.push({
					zoneFrom: "z", // Assuming 'z' is a placeholder or default for origin zone
					zoneTo: zone,
					weightSlab,
					packageWeight: shipment.packageWeight,
				});
			}

			const rates = await findBulkRates({
				userId,
				shipmentDetails: shipmentDetailsForRateCalculation,
				isUserRate: !!userId, // Pass true if userId exists, false otherwise
			});

			return rates;
		}),
});
