import { ADDRESS_TYPE } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addressSchema } from "~/schemas/address";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const addressRouter = createTRPCRouter({
	getAddresses: protectedProcedure
		.input(z.object({ type: z.nativeEnum(ADDRESS_TYPE).optional() }))
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.user.user_id;
				const { type } = input;

				return ctx.db.address.findMany({
					where: {
						user_id: userId,
						...(type && { type: type }),
					},
				});
			} catch (error) {
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
				const userId = ctx.user.user_id;
				const { zipCode, city, state, addressLine, name, type } = input;

				return ctx.db.address.create({
					data: {
						zip_code: zipCode,
						city,
						state,
						address_line: addressLine,
						name,
						type,
						user: {
							connect: { user_id: userId },
						},
					},
				});
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
