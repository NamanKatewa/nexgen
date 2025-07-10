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
				const userId = ctx.user.user_id as string;
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
				const userId = ctx.user.user_id as string;
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

	createManyOrGetExisting: protectedProcedure
		.input(z.array(addressSchema.extend({ type: z.nativeEnum(ADDRESS_TYPE) })))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.user.user_id as string;
				const addressesToProcess = input;

				const existingAddressesMap = new Map<string, string>(); // Key: unique address string, Value: address_id
				const addressesToCreate: typeof addressesToProcess = [];
				const addressInputToKeyMap = new Map<
					(typeof addressesToProcess)[number],
					string
				>();

				// 1. Generate unique keys and prepare for batch existence check
				const uniqueAddressKeys = new Set<string>();
				for (const addr of addressesToProcess) {
					const key = `${addr.zipCode}-${addr.city}-${addr.state}-${addr.addressLine}-${addr.name}-${addr.type}-${userId}`;
					uniqueAddressKeys.add(key);
					addressInputToKeyMap.set(addr, key);
				}

				// 2. Check for existing addresses in bulk
				const existingAddresses = await ctx.db.address.findMany({
					where: {
						user_id: userId,
						OR: addressesToProcess.map((addr) => ({
							zip_code: addr.zipCode,
							city: addr.city,
							state: addr.state,
							address_line: addr.addressLine,
							name: addr.name,
							type: addr.type,
						})),
					},
					select: {
						address_id: true,
						zip_code: true,
						city: true,
						state: true,
						address_line: true,
						name: true,
						type: true,
					},
				});

				for (const existingAddr of existingAddresses) {
					const key = `${existingAddr.zip_code}-${existingAddr.city}-${existingAddr.state}-${existingAddr.address_line}-${existingAddr.name}-${existingAddr.type}-${userId}`;
					existingAddressesMap.set(key, existingAddr.address_id);
				}

				// 3. Identify addresses to create
				for (const addr of addressesToProcess) {
					const key = addressInputToKeyMap.get(addr);
					if (key === undefined) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to retrieve key for address.",
						});
					}
					if (!existingAddressesMap.has(key)) {
						addressesToCreate.push(addr);
					}
				}

				// 4. Create new addresses in bulk
				if (addressesToCreate.length > 0) {
					const createdAddresses = await ctx.db.address.createManyAndReturn({
						data: addressesToCreate.map((addr) => ({
							zip_code: addr.zipCode,
							city: addr.city,
							state: addr.state,
							address_line: addr.addressLine,
							name: addr.name,
							type: addr.type,
							user_id: userId,
						})),
					});
					for (const createdAddr of createdAddresses) {
						const key = `${createdAddr.zip_code}-${createdAddr.city}-${createdAddr.state}-${createdAddr.address_line}-${createdAddr.name}-${createdAddr.type}-${userId}`;
						existingAddressesMap.set(key, createdAddr.address_id);
					}
				}

				// 5. Return address IDs in the original input order
				const resultAddressIds: string[] = [];
				for (const addr of addressesToProcess) {
					const key = addressInputToKeyMap.get(addr);
					if (!key) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to retrieve key for address.",
						});
					}
					const addressId = existingAddressesMap.get(key);
					if (!addressId) {
						// This should ideally not happen if logic is correct
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to retrieve address ID for a processed address.",
						});
					}
					resultAddressIds.push(addressId);
				}

				return resultAddressIds;
			} catch (error) {
				console.error("Error in createManyOrGetExisting:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong during bulk address processing.",
				});
			}
		}),
});
