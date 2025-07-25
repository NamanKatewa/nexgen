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
			try {
				const addresses = await ctx.db.address.findMany({
					where: {
						user_id: ctx.user.user_id,
						...(input.type && { type: input.type }),
					},
					select: {
						zip_code: true,
						name: true,
						address_id: true,
						address_line: true,
						city: true,
						state: true,
						landmark: true,
					},
				});
				return addresses;
			} catch (error) {
				logger.error("address.getAddresses", { ctx, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	createAddress: protectedProcedure
		.input(addressSchema.extend({ type: z.nativeEnum(ADDRESS_TYPE) }))
		.mutation(async ({ ctx, input }) => {
			try {
				if (input.type === ADDRESS_TYPE.Warehouse) {
					const isValidState = await validateAddressForPickup(
						input.zipCode.toString(),
					);

					if (!isValidState) {
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
							landmark: input.landmark || null,
							name: input.name,
							user_id: ctx.user.user_id,
						},
					});
					return pendingAddress;
				}
				const address = await ctx.db.address.create({
					data: {
						zip_code: input.zipCode,
						city: input.city,
						state: input.state,
						address_line: input.addressLine,
						landmark: input.landmark || null,
						name: input.name,
						type: input.type,
						user_id: ctx.user.user_id,
					},
					select: { address_id: true },
				});
				return address;
			} catch (error) {
				logger.error("Failed to create address", { ctx, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
