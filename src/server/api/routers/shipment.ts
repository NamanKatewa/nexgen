import {
	type ADDRESS_TYPE,
	type Prisma,
	SHIPMENT_STATUS,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calculateInsurancePremium } from "~/lib/insurance";
import logger from "~/lib/logger";
import { findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { uploadFileToS3 } from "~/lib/s3";
import { generateShipmentId, getEndOfDay } from "~/lib/utils";

import {
	type TBulkShipmentItemSchema,
	type TShipmentSchema,
	submitShipmentSchema,
} from "~/schemas/shipment";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const shipmentRouter = createTRPCRouter({
	createShipment: protectedProcedure
		.input(submitShipmentSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const addresses = await db.address.findMany({
					where: {
						user_id: ctx.user.user_id as string,
						address_id: {
							in: [input.originAddressId, input.destinationAddressId],
						},
					},
					select: { address_id: true, zip_code: true },
				});

				const originAddress = addresses.find(
					(address) => address.address_id === input.originAddressId,
				);
				const destinationAddress = addresses.find(
					(address) => address.address_id === input.destinationAddressId,
				);
				if (!originAddress) {
					const pending = await db.pendingAddress.findFirst({
						where: { pending_address_id: input.originAddressId },
					});
					if (pending) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"This origin address is currently pending approval. Please wait for it to be approved.",
						});
					}

					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Origin address not found.",
					});
				}
				if (!destinationAddress) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Destination address not found.",
					});
				}

				const originDetails = await getPincodeDetails(
					String(originAddress.zip_code),
				);
				const destinationDetails = await getPincodeDetails(
					String(destinationAddress.zip_code),
				);

				if (!originDetails) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid pincode for origin address: ${originAddress.zip_code}`,
					});
				}
				if (!destinationDetails) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid pincode for destination address: ${destinationAddress.zip_code}`,
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(input.packageWeight * 2) / 2;

				let rate = null;

				if (ctx.user.user_id) {
					// Attempt to find user-specific rate first
					const userRate = await findRate({
						userId: ctx.user.user_id,
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight: input.packageWeight,
						isUserRate: true,
					});

					if (userRate !== null) {
						rate = userRate;
					} else {
						// If user-specific rate not found, fallback to default rate
						const defaultRate = await findRate({
							zoneFrom: "z",
							zoneTo: zone,
							weightSlab,
							packageWeight: input.packageWeight,
							isUserRate: false,
						});
						if (defaultRate !== null) {
							rate = defaultRate;
						}
					}
				} else {
					// For unauthenticated users, directly use default rate
					const defaultRate = await findRate({
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight: input.packageWeight,
						isUserRate: false,
					});
					if (defaultRate !== null) {
						rate = defaultRate;
					}
				}

				if (rate === null) {
					logger.error("shipment.createShipment", {
						ctx,
						input,
					});
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Rate not found for the given shipment details.",
					});
				}

				const { insurancePremium, compensationAmount } =
					calculateInsurancePremium(
						input.declaredValue ?? rate,
						input.isInsuranceSelected,
					);

				const finalShippingCost = rate + insurancePremium;

				const human_readable_shipment_id = generateShipmentId(ctx.user.user_id);

				await db.$transaction(async (tx) => {
					const packageImageUrl = await uploadFileToS3(
						input.packageImage,
						"shipment/",
					);

					let invoiceUrl: string | undefined;
					if (input.invoice) {
						invoiceUrl = await uploadFileToS3(input.invoice, "invoices/");
					}
					const shipment = await tx.shipment.create({
						data: {
							human_readable_shipment_id,
							user_id: ctx.user.user_id,
							payment_status: "Pending",
							shipment_status: "PendingApproval",
							origin_address_id: originAddress?.address_id,
							destination_address_id: destinationAddress?.address_id,
							recipient_name: input.recipientName,
							recipient_mobile: input.recipientMobile,
							package_image_url: packageImageUrl,
							package_weight: input.packageWeight,
							package_dimensions: `${input.packageBreadth} X ${input.packageHeight} X ${input.packageLength}`,
							shipping_cost: finalShippingCost,
							declared_value: input.declaredValue,
							is_insurance_selected: input.isInsuranceSelected,
							insurance_premium: insurancePremium,
							compensation_amount: compensationAmount,
							invoiceUrl: invoiceUrl,
						},
						select: { shipment_id: true },
					});
					const wallet = await tx.wallet.findUnique({
						where: { user_id: ctx.user.user_id },
						select: { balance: true, user_id: true },
					});

					if (!wallet) {
						logger.error("shipment.createShipment", { ctx, input });
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "User wallet not found.",
						});
					}

					if (wallet.balance.lessThan(new Decimal(finalShippingCost))) {
						throw new TRPCError({
							code: "BAD_GATEWAY",
							message: "Insufficient wallet balance. Recharge your wallet.",
						});
					}

					await tx.wallet.update({
						where: { user_id: wallet.user_id },
						data: { balance: { decrement: new Decimal(finalShippingCost) } },
					});

					await tx.transaction.create({
						data: {
							user_id: wallet.user_id,
							transaction_type: "Debit",
							amount: new Decimal(finalShippingCost),
							payment_status: "Completed",
							shipment_id: shipment.shipment_id,
							description: "Single Shipment Created",
						},
					});

					await tx.shipment.update({
						where: {
							shipment_id: shipment.shipment_id,
							user_id: wallet.user_id,
						},
						data: {
							payment_status: "Paid",
						},
					});

					return {
						success: true,
						message: "Shipment created successfully",
						shipmentId: shipment.shipment_id,
					};
				});
			} catch (error) {
				logger.error("shipment.createShipment", { ctx, input, error });
				throw error;
			}
		}),

	// createBulkShipments: protectedProcedure
	// 	.input(bulkShipmentsSchema)
	// 	.mutation(async ({ ctx, input }) => {
	// 		const { user } = ctx;
	// 		const userId = user.user_id;

	// 		const logData = {
	// 			userId,
	// 			shipmentCount: input.shipments.length,
	// 		};
	// 		logger.info("Starting performant bulk shipment creation v3", logData);

	// 		await getPincodeDetails("0");

	// 		const originAddressKeys = new Map<string, TBulkShipmentItemSchema>();
	// 		const destAddressKeys = new Map<string, TBulkShipmentItemSchema>();
	// 		for (const s of input.shipments) {
	// 			const originKey =
	// 				`${s.originAddressLine}-${s.originCity}-${s.originState}-${s.originZipCode}`.toLowerCase();
	// 			const destKey =
	// 				`${s.destinationAddressLine}-${s.destinationCity}-${s.destinationState}-${s.destinationZipCode}`.toLowerCase();
	// 			if (!originAddressKeys.has(originKey))
	// 				originAddressKeys.set(originKey, s);
	// 			if (!destAddressKeys.has(destKey)) destAddressKeys.set(destKey, s);
	// 		}

	// 		const [existingApproved, existingPending] = await Promise.all([
	// 			db.address.findMany({ where: { user_id: user.user_id as string } }),
	// 			db.pendingAddress.findMany({
	// 				where: { user_id: user.user_id },
	// 			}),
	// 		]);

	// 		const approvedMap = new Map(
	// 			existingApproved.map((a) => [
	// 				`${a.address_line}-${a.city}-${a.state}-${a.zip_code}`.toLowerCase(),
	// 				a,
	// 			]),
	// 		);
	// 		const pendingMap = new Map(
	// 			existingPending.map((a) => [
	// 				`${a.address_line}-${a.city}-${a.state}-${a.zip_code}`.toLowerCase(),
	// 				a,
	// 			]),
	// 		);

	// 		const results: ShipmentResult[] = [];
	// 		const shipmentsReady: ShipmentReady[] = [];
	// 		const newPendingToCreate: NewPendingAddress[] = [];
	// 		const newDestinationsToCreate: NewDestinationAddress[] = [];

	// 		for (const shipment of input.shipments) {
	// 			const originKey =
	// 				`${shipment.originAddressLine}-${shipment.originCity}-${shipment.originState}-${shipment.originZipCode}`.toLowerCase();
	// 			const approvedOrigin = approvedMap.get(originKey);

	// 			if (approvedOrigin) {
	// 				shipmentsReady.push({
	// 					...shipment,
	// 					originAddressId: approvedOrigin.address_id,
	// 				});
	// 			} else if (pendingMap.has(originKey)) {
	// 				logger.warn("Origin address already pending approval", {
	// 					...logData,
	// 					recipientName: shipment.recipientName,
	// 					originKey,
	// 				});
	// 				results.push({
	// 					recipientName: shipment.recipientName,
	// 					status: "pending",
	// 					message: "New origin address sent for admin approval.",
	// 				});
	// 			} else {
	// 				const isValid = await validateAddressForPickup(
	// 					shipment.originZipCode,
	// 				);
	// 				if (isValid) {
	// 					newPendingToCreate.push({
	// 						user_id: user.user_id as string,
	// 						name: `Origin for ${shipment.recipientName}`,
	// 						address_line: shipment.originAddressLine,
	// 						landmark: shipment.originLandmark || null,
	// 						city: shipment.originCity,
	// 						state: shipment.originState,
	// 						zip_code: Number(shipment.originZipCode),
	// 					});
	// 					logger.info("New origin address sent for admin approval", {
	// 						...logData,
	// 						recipientName: shipment.recipientName,
	// 						originAddressLine: shipment.originAddressLine,
	// 						originCity: shipment.originCity,
	// 						originState: shipment.originState,
	// 						originZipCode: shipment.originZipCode,
	// 					});
	// 					results.push({
	// 						recipientName: shipment.recipientName,
	// 						status: "pending",
	// 						message: "New origin address sent for admin approval.",
	// 					});
	// 				} else {
	// 					logger.warn("Pickup from state not available", {
	// 						...logData,
	// 						recipientName: shipment.recipientName,
	// 						originState: shipment.originState,
	// 					});
	// 					results.push({
	// 						recipientName: shipment.recipientName,
	// 						status: "error",
	// 						message: `Pickup from '${shipment.originState}' is not available.`,
	// 					});
	// 				}
	// 			}
	// 		}

	// 		for (const shipment of shipmentsReady) {
	// 			const destKey =
	// 				`${shipment.destinationAddressLine}-${shipment.destinationCity}-${shipment.destinationState}-${shipment.destinationZipCode}`.toLowerCase();
	// 			if (!approvedMap.has(destKey)) {
	// 				logger.info("New destination address to be created", {
	// 					...logData,
	// 					recipientName: shipment.recipientName,
	// 					destinationAddressLine: shipment.destinationAddressLine,
	// 					destinationCity: shipment.destinationCity,
	// 					destinationState: shipment.destinationState,
	// 					destinationZipCode: shipment.destinationZipCode,
	// 				});
	// 				newDestinationsToCreate.push({
	// 					user_id: user.user_id as string,
	// 					name: shipment.recipientName,
	// 					address_line: shipment.destinationAddressLine,
	// 					landmark: shipment.destinationLandmark || null,
	// 					city: shipment.destinationCity,
	// 					state: shipment.destinationState,
	// 					zip_code: Number(shipment.destinationZipCode),
	// 					type: ADDRESS_TYPE.User,
	// 				});
	// 			}
	// 		}

	// 		if (newPendingToCreate.length > 0) {
	// 			await db.pendingAddress.createMany({ data: newPendingToCreate });
	// 			logger.info("Successfully created new pending addresses", {
	// 				...logData,
	// 				count: newPendingToCreate.length,
	// 			});
	// 		}
	// 		if (newDestinationsToCreate.length > 0) {
	// 			await db.address.createMany({
	// 				data: newDestinationsToCreate.map((a) => ({
	// 					...a,
	// 				})),
	// 			});
	// 			logger.info("Successfully created new destination addresses", {
	// 				...logData,
	// 				count: newDestinationsToCreate.length,
	// 			});
	// 			const allDests = await db.address.findMany({
	// 				where: { user_id: user.user_id as string, type: ADDRESS_TYPE.User },
	// 			});
	// 			for (const a of allDests) {
	// 				approvedMap.set(
	// 					`${a.address_line}-${a.city}-${a.state}-${a.zip_code}`.toLowerCase(),
	// 					a,
	// 				);
	// 			}
	// 		}

	// 		if (shipmentsReady.length > 0) {
	// 			const finalShipments: FinalShipmentItem[] = shipmentsReady.map((s) => {
	// 				const destKey =
	// 					`${s.destinationAddressLine}-${s.destinationCity}-${s.destinationState}-${s.destinationZipCode}`.toLowerCase();
	// 				const destAddress = approvedMap.get(destKey);
	// 				if (!destAddress) {
	// 					logger.error(
	// 						"Could not find destination address for final shipment",
	// 						{
	// 							...logData,
	// 							recipientName: s.recipientName,
	// 							destKey,
	// 						},
	// 					);
	// 					throw new TRPCError({
	// 						code: "INTERNAL_SERVER_ERROR",
	// 						message: `Could not find destination address for ${s.recipientName}`,
	// 					});
	// 				}
	// 				return { ...s, destinationAddressId: destAddress.address_id };
	// 			});

	// 			try {
	// 				const transactionResults = await db.$transaction(async (tx) => {
	// 					const rateDetails = await Promise.all(
	// 						finalShipments.map(async (s) => {
	// 							const origin = approvedMap.get(
	// 								`${s.originAddressLine}-${s.originCity}-${s.originState}-${s.originZipCode}`.toLowerCase(),
	// 							);
	// 							if (!origin) {
	// 								throw new TRPCError({
	// 									code: "INTERNAL_SERVER_ERROR",
	// 									message: `Origin address not found for ${s.recipientName}`,
	// 								});
	// 							}
	// 							logger.error(
	// 								"Origin address not found during rate calculation",
	// 								{
	// 									...logData,
	// 									recipientName: s.recipientName,
	// 									originAddressLine: s.originAddressLine,
	// 								},
	// 							);
	// 							const dest = approvedMap.get(
	// 								`${s.destinationAddressLine}-${s.destinationCity}-${s.destinationState}-${s.destinationZipCode}`.toLowerCase(),
	// 							);
	// 							if (!dest) {
	// 								throw new TRPCError({
	// 									code: "INTERNAL_SERVER_ERROR",
	// 									message: `Destination address not found for ${s.recipientName}`,
	// 								});
	// 							}
	// 							logger.error(
	// 								"Destination address not found during rate calculation",
	// 								{
	// 									...logData,
	// 									recipientName: s.recipientName,
	// 									destinationAddressLine: s.destinationAddressLine,
	// 								},
	// 							);
	// 							const originDetails = await getPincodeDetails(
	// 								String(origin.zip_code),
	// 							);
	// 							const destDetails = await getPincodeDetails(
	// 								String(dest.zip_code),
	// 							);
	// 							if (!originDetails || !destDetails)
	// 								throw new TRPCError({
	// 									code: "BAD_REQUEST",
	// 									message: `Invalid pincode for shipment to ${s.recipientName}`,
	// 								});
	// 							logger.warn(
	// 								"Invalid pincode for shipment during rate calculation",
	// 								{
	// 									...logData,
	// 									recipientName: s.recipientName,
	// 									originZipCode: origin.zip_code,
	// 									destZipCode: dest.zip_code,
	// 								},
	// 							);
	// 							const { zone } = getZone(originDetails, destDetails);
	// 							const weightSlab = Math.ceil(s.packageWeight * 2) / 2;
	// 							return {
	// 								zoneFrom: "z",
	// 								zoneTo: zone,
	// 								weightSlab,
	// 								packageWeight: s.packageWeight,
	// 							};
	// 						}),
	// 					);

	// 					const calculatedRates = await findBulkRates({
	// 						userId: user.user_id,
	// 						shipmentDetails: rateDetails,
	// 						isUserRate: true,
	// 					});
	// 					let totalAmount = new Decimal(0);
	// 					const shipmentsWithRates: ShipmentWithRateGuaranteed[] = [];

	// 					for (let i = 0; i < finalShipments.length; i++) {
	// 						const currentShipment = finalShipments[i];
	// 						if (!currentShipment) {
	// 							throw new TRPCError({
	// 								code: "INTERNAL_SERVER_ERROR",
	// 								message: "Shipment item not found during rate calculation.",
	// 							});
	// 						}
	// 						const rate = calculatedRates[i];
	// 						if (rate === null || rate === undefined)
	// 							throw new TRPCError({
	// 								code: "NOT_FOUND",
	// 								message: `Rate not found for shipment to ${currentShipment.recipientName}`,
	// 							});
	// 						logger.error("Rate not found for individual bulk shipment", {
	// 							...logData,
	// 							recipientName: currentShipment.recipientName,
	// 							rateDetails: rateDetails[i],
	// 						});

	// 						const { insurancePremium, compensationAmount } =
	// 							calculateInsurancePremium(
	// 								currentShipment.declaredValue ?? rate,
	// 								currentShipment.isInsuranceSelected,
	// 							);

	// 						const finalShippingCost = rate + insurancePremium;

	// 						totalAmount = totalAmount.add(new Decimal(finalShippingCost));
	// 						shipmentsWithRates.push({
	// 							...currentShipment,
	// 							rate: finalShippingCost,
	// 							insurancePremium,
	// 							compensationAmount,
	// 						} as ShipmentWithRateGuaranteed);
	// 					}

	// 					const wallet = await tx.wallet.findUnique({
	// 						where: { user_id: user.user_id as string },
	// 					});
	// 					if (!wallet) {
	// 						logger.error(
	// 							"User wallet not found during bulk shipment creation",
	// 							{ ...logData },
	// 						);
	// 						throw new TRPCError({
	// 							code: "BAD_REQUEST",
	// 							message: "Insufficient wallet balance.",
	// 						});
	// 					}
	// 					if (wallet.balance.lessThan(totalAmount)) {
	// 						logger.warn("Insufficient wallet balance for bulk shipment", {
	// 							...logData,
	// 							currentBalance: wallet.balance,
	// 							requiredAmount: totalAmount,
	// 						});
	// 						throw new TRPCError({
	// 							code: "BAD_REQUEST",
	// 							message: "Insufficient wallet balance.",
	// 						});
	// 					}

	// 					await tx.wallet.update({
	// 						where: { user_id: user.user_id as string },
	// 						data: { balance: { decrement: totalAmount } },
	// 					});

	// 					await tx.transaction.create({
	// 						data: {
	// 							user_id: user.user_id as string,
	// 							transaction_type: "Debit",
	// 							amount: totalAmount,
	// 							payment_status: "Completed",
	// 							description: "Bulk Shipments Created",
	// 						},
	// 					});

	// 					const uploadPromises = shipmentsWithRates.map(async (s) => {
	// 						if (!s.packageImage) {
	// 							throw new TRPCError({
	// 								code: "BAD_REQUEST",
	// 								message: `Package image is missing for shipment to ${s.recipientName}`,
	// 							});
	// 						}
	// 						const packageImageUrl = await uploadFileToS3(
	// 							s.packageImage,
	// 							"shipment/",
	// 						);
	// 						let invoiceUrl: string | undefined;
	// 						if (s.isInsuranceSelected && s.invoice) {
	// 							invoiceUrl = await uploadFileToS3(s.invoice, "invoices/");
	// 						}
	// 						return { packageImageUrl, invoiceUrl };
	// 					});

	// 					const uploadedFiles: {
	// 						packageImageUrl: string;
	// 						invoiceUrl: string | undefined;
	// 					}[] = await Promise.all(uploadPromises);
	// 					const createdShipmentRecords = [];

	// 					for (let i = 0; i < shipmentsWithRates.length; i++) {
	// 						const s = shipmentsWithRates[i];
	// 						if (!s) {
	// 							throw new TRPCError({
	// 								code: "INTERNAL_SERVER_ERROR",
	// 								message: "Shipment item not found during processing.",
	// 							});
	// 						}
	// 						const uploadedFile = uploadedFiles[i];
	// 						if (!uploadedFile) {
	// 							throw new TRPCError({
	// 								code: "INTERNAL_SERVER_ERROR",
	// 								message: "Uploaded file data not found for shipment.",
	// 							});
	// 						}
	// 						const { packageImageUrl, invoiceUrl } = uploadedFile;
	// 						if (!packageImageUrl) {
	// 							logger.error("Missing package image URL for shipment", {
	// 								...logData,
	// 								shipmentIndex: i,
	// 							});
	// 							results.push({
	// 								recipientName: s.recipientName,
	// 								status: "error",
	// 								message: "Missing package image URL",
	// 							});
	// 							continue;
	// 						}
	// 						const human_readable_shipment_id = generateShipmentId(
	// 							user.user_id,
	// 						);
	// 						const shipment = await tx.shipment.create({
	// 							data: {
	// 								human_readable_shipment_id,
	// 								user_id: userId,
	// 								payment_status: "Paid",
	// 								shipment_status: "PendingApproval",
	// 								origin_address_id: s.originAddressId,
	// 								destination_address_id: s.destinationAddressId,
	// 								recipient_name: s.recipientName,
	// 								recipient_mobile: s.recipientMobile,
	// 								package_image_url: packageImageUrl,
	// 								package_weight: s.packageWeight,
	// 								package_dimensions: `${s.packageBreadth} X ${s.packageHeight} X ${s.packageLength}`,
	// 								shipping_cost: s.rate,
	// 								declared_value: s.declaredValue,
	// 								is_insurance_selected: s.isInsuranceSelected,
	// 								insurance_premium: s.insurancePremium,
	// 								compensation_amount: s.compensationAmount,
	// 								invoiceUrl: invoiceUrl,
	// 							},
	// 						});
	// 						createdShipmentRecords.push({
	// 							recipientName: s.recipientName,
	// 							shipmentId: shipment.shipment_id,
	// 						});
	// 					}
	// 					return createdShipmentRecords;
	// 				});

	// 				for (const created of transactionResults) {
	// 					results.push({
	// 						...created,
	// 						status: "success",
	// 						message: "Shipment created successfully.",
	// 					});
	// 				}
	// 				logger.info("Successfully processed bulk shipments in transaction", {
	// 					...logData,
	// 					createdShipmentCount: transactionResults.length,
	// 				});
	// 			} catch (error) {
	// 				logger.error("Bulk shipment transaction failed", {
	// 					...logData,
	// 					error,
	// 				});
	// 				for (const s of finalShipments) {
	// 					results.push({
	// 						recipientName: s.recipientName,
	// 						status: "error",
	// 						message:
	// 							error instanceof TRPCError
	// 								? error.message
	// 								: "Transaction failed.",
	// 					});
	// 				}
	// 			}
	// 		}

	// 		logger.info("Finished performant bulk shipment processing", {
	// 			...logData,
	// 			results,
	// 		});
	// 		return results;
	// 	}),

	getAllShipments: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				status: z.enum(["PendingApproval", "Approved", "Rejected"]).optional(),
				userId: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize, status, userId, startDate, endDate } = input;
			const skip = (page - 1) * pageSize;

			const where: Prisma.ShipmentWhereInput = {
				shipment_status: status,
				...(userId
					? {
							OR: [{ user_id: userId }, { user: { email: userId } }],
						}
					: {}),
			};

			if (startDate && endDate) {
				where.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where,
					select: {
						shipment_id: true,
						human_readable_shipment_id: true,
						user_id: true,
						shipping_cost: true,
						shipment_status: true,
						current_status: true,
						payment_status: true,
						created_at: true,
						user: {
							select: {
								name: true,
								email: true,
							},
						},
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),
	getAllTrackingShipments: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				userId: z.string().optional(),
				currentStatus: z
					.union([z.nativeEnum(SHIPMENT_STATUS), z.literal("ALL")])
					.optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize, userId, currentStatus, startDate, endDate } =
				input;
			const skip = (page - 1) * pageSize;

			const whereClause: Prisma.ShipmentWhereInput = {
				shipment_status: "Approved",
				user_id: userId,
			};

			if (currentStatus && currentStatus !== "ALL") {
				whereClause.current_status = currentStatus;
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where: whereClause,
					select: {
						human_readable_shipment_id: true,
						user_id: true,
						recipient_name: true,
						awb_number: true,
						current_status: true,
						created_at: true,
						shipment_id: true,
						shipment_status: true,
						user: {
							select: {
								name: true,
								email: true,
								company_name: true,
							},
						},
						courier: { select: { name: true } },
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where: whereClause,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),

	getShipmentStatusCounts: adminProcedure.query(async () => {
		const statusCounts = await db.shipment.groupBy({
			by: ["current_status"],
			_count: {
				current_status: true,
			},
			where: { shipment_status: "Approved" },
		});

		const counts: Record<string, number> = {};
		let totalCount = 0;
		for (const statusKey of Object.values(SHIPMENT_STATUS)) {
			counts[statusKey] = 0;
		}

		for (const item of statusCounts) {
			if (item.current_status) {
				counts[item.current_status] = item._count.current_status;
				totalCount += item._count.current_status;
			}
		}
		counts.ALL = totalCount;
		return counts;
	}),

	getUserShipments: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				status: z.enum(["PendingApproval", "Approved", "Rejected"]).optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, status, searchFilter, startDate, endDate } =
				input;
			const skip = (page - 1) * pageSize;

			const whereClause: Prisma.ShipmentWhereInput = {
				user_id: ctx.user.user_id,
				shipment_status: status,
			};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where: whereClause,
					select: {
						human_readable_shipment_id: true,
						recipient_name: true,
						recipient_mobile: true,
						shipping_cost: true,
						current_status: true,
						created_at: true,
						shipment_id: true,
						shipment_status: true,
						payment_status: true,
						user: {
							select: {
								name: true,
								email: true,
							},
						},
						origin_address: true,
						destination_address: true,
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where: whereClause,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),
	getUserTrackingShipments: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				status: z.enum(["PendingApproval", "Approved", "Rejected"]).optional(),
				searchFilter: z.string().optional(),
				currentStatus: z
					.union([z.nativeEnum(SHIPMENT_STATUS), z.literal("ALL")])
					.optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const {
				page,
				pageSize,
				searchFilter,
				currentStatus,
				startDate,
				endDate,
			} = input;
			const skip = (page - 1) * pageSize;

			const whereClause: Prisma.ShipmentWhereInput = {
				user_id: ctx.user.user_id,
				shipment_status: "Approved",
			};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (currentStatus && currentStatus !== "ALL") {
				whereClause.current_status = currentStatus;
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where: whereClause,
					include: {
						user: {
							select: {
								name: true,
								email: true,
							},
						},
						origin_address: true,
						destination_address: true,
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where: whereClause,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),

	getUserShipmentStatusCounts: protectedProcedure.query(async ({ ctx }) => {
		const statusCounts = await db.shipment.groupBy({
			by: ["current_status"],
			_count: {
				current_status: true,
			},
			where: { user_id: ctx.user.user_id, shipment_status: "Approved" },
		});

		const counts: Record<string, number> = {};
		let totalCount = 0;
		for (const statusKey of Object.values(SHIPMENT_STATUS)) {
			counts[statusKey] = 0;
		}

		for (const item of statusCounts) {
			if (item.current_status) {
				counts[item.current_status] = item._count.current_status;
				totalCount += item._count.current_status;
			}
		}
		counts.ALL = totalCount;
		return counts;
	}),

	getNdrShipments: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				userId: z.string().optional(),
				currentStatus: z
					.union([z.nativeEnum(SHIPMENT_STATUS), z.literal("ALL")])
					.optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize, userId, currentStatus, startDate, endDate } =
				input;
			const skip = (page - 1) * pageSize;

			const ndrStatuses: SHIPMENT_STATUS[] = [
				SHIPMENT_STATUS.UNDELIVERED,
				SHIPMENT_STATUS.RTO,
				SHIPMENT_STATUS.RTO_DELIVERED,
				SHIPMENT_STATUS.CANCELLED,
				SHIPMENT_STATUS.ON_HOLD,
				SHIPMENT_STATUS.NETWORK_ISSUE,
				SHIPMENT_STATUS.DELIVERY_NEXT_DAY,
				SHIPMENT_STATUS.NOT_FOUND_INCORRECT,
				SHIPMENT_STATUS.OUT_OF_DELIVERY_AREA,
				SHIPMENT_STATUS.OTHERS,
				SHIPMENT_STATUS.DELIVERY_DELAYED,
				SHIPMENT_STATUS.CUSTOMER_REFUSED,
				SHIPMENT_STATUS.CONSIGNEE_UNAVAILABLE,
				SHIPMENT_STATUS.DELIVERY_EXCEPTION,
				SHIPMENT_STATUS.DELIVERY_RESCHEDULED,
				SHIPMENT_STATUS.COD_PAYMENT_NOT_READY,
				SHIPMENT_STATUS.SHIPMENT_LOST,
				SHIPMENT_STATUS.PICKUP_FAILED,
				SHIPMENT_STATUS.PICKUP_CANCELLED,
				SHIPMENT_STATUS.FUTURE_DELIVERY_REQUESTED,
				SHIPMENT_STATUS.ADDRESS_INCORRECT,
				SHIPMENT_STATUS.DELIVERY_ATTEMPTED,
				SHIPMENT_STATUS.PENDING_UNDELIVERED,
				SHIPMENT_STATUS.DELIVERY_ATTEMPTED_PREMISES_CLOSED,
				SHIPMENT_STATUS.RETURN_REQUEST_CANCELLED,
				SHIPMENT_STATUS.RETURN_REQUEST_CLOSED,
				SHIPMENT_STATUS.RETURN_DELIVERED,
				SHIPMENT_STATUS.RETURN_IN_TRANSIT,
				SHIPMENT_STATUS.RETURN_OUT_FOR_PICKUP,
				SHIPMENT_STATUS.RETURN_SHIPMENT_PICKED_UP,
				SHIPMENT_STATUS.RETURN_PICKUP_RESCHEDULED,
				SHIPMENT_STATUS.RETURN_PICKUP_DELAYED,
				SHIPMENT_STATUS.RETURN_PICKUP_SCHEDULED,
				SHIPMENT_STATUS.RETURN_OUT_FOR_DELIVERY,
				SHIPMENT_STATUS.RETURN_UNDELIVERED,
				SHIPMENT_STATUS.REVERSE_PICKUP_EXCEPTION,
			];

			const whereClause: Prisma.ShipmentWhereInput = {
				shipment_status: "Approved",
				user_id: userId,
				current_status:
					currentStatus && currentStatus !== "ALL"
						? currentStatus
						: { in: ndrStatuses },
			};

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where: whereClause,
					include: {
						user: {
							select: {
								name: true,
								email: true,
								company_name: true,
							},
						},
						courier: { select: { name: true } },
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where: whereClause,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),

	getUserNdrShipments: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				status: z.enum(["PendingApproval", "Approved", "Rejected"]).optional(),
				searchFilter: z.string().optional(),
				currentStatus: z
					.union([z.nativeEnum(SHIPMENT_STATUS), z.literal("ALL")])
					.optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { user } = ctx;
			const {
				page,
				pageSize,
				searchFilter,
				currentStatus,
				startDate,
				endDate,
			} = input;
			const skip = (page - 1) * pageSize;

			const ndrStatuses: SHIPMENT_STATUS[] = [
				SHIPMENT_STATUS.UNDELIVERED,
				SHIPMENT_STATUS.RTO,
				SHIPMENT_STATUS.RTO_DELIVERED,
				SHIPMENT_STATUS.CANCELLED,
				SHIPMENT_STATUS.ON_HOLD,
				SHIPMENT_STATUS.NETWORK_ISSUE,
				SHIPMENT_STATUS.DELIVERY_NEXT_DAY,
				SHIPMENT_STATUS.NOT_FOUND_INCORRECT,
				SHIPMENT_STATUS.OUT_OF_DELIVERY_AREA,
				SHIPMENT_STATUS.OTHERS,
				SHIPMENT_STATUS.DELIVERY_DELAYED,
				SHIPMENT_STATUS.CUSTOMER_REFUSED,
				SHIPMENT_STATUS.CONSIGNEE_UNAVAILABLE,
				SHIPMENT_STATUS.DELIVERY_EXCEPTION,
				SHIPMENT_STATUS.DELIVERY_RESCHEDULED,
				SHIPMENT_STATUS.COD_PAYMENT_NOT_READY,
				SHIPMENT_STATUS.SHIPMENT_LOST,
				SHIPMENT_STATUS.PICKUP_FAILED,
				SHIPMENT_STATUS.PICKUP_CANCELLED,
				SHIPMENT_STATUS.FUTURE_DELIVERY_REQUESTED,
				SHIPMENT_STATUS.ADDRESS_INCORRECT,
				SHIPMENT_STATUS.DELIVERY_ATTEMPTED,
				SHIPMENT_STATUS.PENDING_UNDELIVERED,
				SHIPMENT_STATUS.DELIVERY_ATTEMPTED_PREMISES_CLOSED,
				SHIPMENT_STATUS.RETURN_REQUEST_CANCELLED,
				SHIPMENT_STATUS.RETURN_REQUEST_CLOSED,
				SHIPMENT_STATUS.RETURN_DELIVERED,
				SHIPMENT_STATUS.RETURN_IN_TRANSIT,
				SHIPMENT_STATUS.RETURN_OUT_FOR_PICKUP,
				SHIPMENT_STATUS.RETURN_SHIPMENT_PICKED_UP,
				SHIPMENT_STATUS.RETURN_PICKUP_RESCHEDULED,
				SHIPMENT_STATUS.RETURN_PICKUP_DELAYED,
				SHIPMENT_STATUS.RETURN_PICKUP_SCHEDULED,
				SHIPMENT_STATUS.RETURN_OUT_FOR_DELIVERY,
				SHIPMENT_STATUS.RETURN_UNDELIVERED,
				SHIPMENT_STATUS.REVERSE_PICKUP_EXCEPTION,
			];

			const whereClause: Prisma.ShipmentWhereInput = {
				user_id: user.user_id,
				shipment_status: "Approved",
				current_status:
					currentStatus && currentStatus !== "ALL"
						? currentStatus
						: { in: ndrStatuses },
			};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			const [shipments, totalShipments] = await db.$transaction([
				db.shipment.findMany({
					where: whereClause,
					include: {
						user: {
							select: {
								name: true,
								email: true,
							},
						},
						origin_address: true,
						destination_address: true,
					},
					skip,
					take: pageSize,
					orderBy: {
						created_at: "desc",
					},
				}),
				db.shipment.count({
					where: whereClause,
				}),
			]);

			return {
				shipments,
				totalShipments,
				page,
				pageSize,
				totalPages: Math.ceil(totalShipments / pageSize),
			};
		}),

	getShipmentById: protectedProcedure
		.input(z.object({ shipmentId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { user } = ctx;
			const { shipmentId } = input;

			const shipment = await db.shipment.findUnique({
				where: { shipment_id: shipmentId },
				include: {
					user: {
						select: {
							name: true,
							email: true,
							user_id: true,
							kyc: {
								select: {
									entity_name: true,
								},
							},
						},
					},
					origin_address: true,
					destination_address: true,
					tracking: true,
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found.",
				});
			}

			if (user.role !== "Admin" && shipment.user_id !== user.user_id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to view this shipment.",
				});
			}

			return shipment;
		}),
});
