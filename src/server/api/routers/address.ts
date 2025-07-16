import { ADDRESS_TYPE } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { validateAddressForPickup } from "~/lib/address-utils";
import logger from "~/lib/logger";
import { addressSchema } from "~/schemas/address";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const addressRouter = createTRPCRouter({
	getAddresses: protectedProcedure
		.input(z.object({ type: z.nativeEnum(ADDRESS_TYPE).optional() }))
		.query(async ({ ctx, input }) => {
			const logData = { userId: ctx.user.user_id, input };
			logger.info("Getting addresses", logData);

			try {
				const addresses = await ctx.db.address.findMany({
					where: {
						user_id: ctx.user.user_id,
						...(input.type && { type: input.type }),
					},
				});
				logger.info("Successfully retrieved addresses", {
					...logData,
					count: addresses.length,
				});
				return addresses;
			} catch (error) {
				logger.error("Failed to get addresses", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	createAddress: protectedProcedure
		.input(addressSchema.extend({ type: z.nativeEnum(ADDRESS_TYPE) }))
		.mutation(async ({ ctx, input }) => {
			const logData = { userId: ctx.user.user_id, input };
			logger.info("Creating address", logData);

			try {
				if (input.type === ADDRESS_TYPE.Warehouse) {
					const isValidState = await validateAddressForPickup(
						input.zipCode.toString(),
					);

					if (!isValidState) {
						logger.warn(
							"Attempted to create warehouse address in disallowed state",
							logData,
						);
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Pickup addresses are only allowed in Delhi, Uttar Pradesh, Haryana, Bihar, and West Bengal. The provided state '${input.state}' is not allowed or does not match the pincode's state.`,
						});
					}

					const pendingAddress = await ctx.db.pendingAddress.create({
						data: {
							zip_code: input.zipCode,
							city: input.city,
							state: input.state,
							address_line: input.addressLine,
							name: input.name,
							user: {
								connect: { user_id: ctx.user.user_id as string },
							},
						},
					});
					logger.info("Successfully created pending warehouse address", {
						...logData,
						pendingAddressId: pendingAddress.pending_address_id,
					});
					return pendingAddress;
				}
				const address = await ctx.db.address.create({
					data: {
						zip_code: input.zipCode,
						city: input.city,
						state: input.state,
						address_line: input.addressLine,
						name: input.name,
						type: input.type,
						user: {
							connect: { user_id: ctx.user.user_id as string },
						},
					},
				});
				logger.info("Successfully created address", {
					...logData,
					addressId: address.address_id,
				});
				return address;
			} catch (error) {
				logger.error("Failed to create address", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
