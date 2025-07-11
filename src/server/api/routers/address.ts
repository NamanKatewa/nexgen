import logger from "~/lib/logger";
import { ADDRESS_TYPE } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
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

  createManyOrGetExisting: protectedProcedure
    .input(z.array(addressSchema.extend({ type: z.nativeEnum(ADDRESS_TYPE) })))
    .mutation(async ({ ctx, input }) => {
      const logData = { userId: ctx.user.user_id, inputCount: input.length };
      logger.info("Starting bulk address processing", logData);

      try {
        const userId = ctx.user.user_id;
        const addressesToProcess = input;

        const existingAddressesMap = new Map<string, string>();
        const addressesToCreate: typeof addressesToProcess = [];
        const addressInputToKeyMap = new Map<
          (typeof addressesToProcess)[number],
          string
        >();

        const uniqueAddressKeys = new Set<string>();
        for (const addr of addressesToProcess) {
          const key = `${addr.zipCode}-${addr.city}-${addr.state}-${addr.addressLine}-${addr.name}-${addr.type}-${userId}`;
          uniqueAddressKeys.add(key);
          addressInputToKeyMap.set(addr, key);
        }
        logger.info("Generated unique keys for addresses", {
          ...logData,
          uniqueKeyCount: uniqueAddressKeys.size,
        });

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
        logger.info("Found existing addresses", {
          ...logData,
          existingCount: existingAddresses.length,
        });

        for (const existingAddr of existingAddresses) {
          const key = `${existingAddr.zip_code}-${existingAddr.city}-${existingAddr.state}-${existingAddr.address_line}-${existingAddr.name}-${existingAddr.type}-${userId}`;
          existingAddressesMap.set(key, existingAddr.address_id);
        }

        for (const addr of addressesToProcess) {
          const key = addressInputToKeyMap.get(addr);
          if (key === undefined) {
            logger.error("Failed to retrieve key for address", {
              ...logData,
              address: addr,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve key for address.",
            });
          }
          if (!existingAddressesMap.has(key)) {
            addressesToCreate.push(addr);
          }
        }
        logger.info("Identified addresses to create", {
          ...logData,
          createCount: addressesToCreate.length,
        });

        if (addressesToCreate.length > 0) {
          const createdAddresses = await ctx.db.address.createManyAndReturn({
            data: addressesToCreate.map((addr) => ({
              zip_code: addr.zipCode,
              city: addr.city,
              state: addr.state,
              address_line: addr.addressLine,
              name: addr.name,
              type: addr.type,
              user_id: userId as string,
            })),
          });
          logger.info("Bulk created new addresses", {
            ...logData,
            createdCount: createdAddresses.length,
          });
          for (const createdAddr of createdAddresses) {
            const key = `${createdAddr.zip_code}-${createdAddr.city}-${createdAddr.state}-${createdAddr.address_line}-${createdAddr.name}-${createdAddr.type}-${userId}`;
            existingAddressesMap.set(key, createdAddr.address_id);
          }
        }

        const resultAddressIds: string[] = [];
        for (const addr of addressesToProcess) {
          const key = addressInputToKeyMap.get(addr);
          if (!key) {
            logger.error("Failed to retrieve key for address post-creation", {
              ...logData,
              address: addr,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve key for address.",
            });
          }
          const addressId = existingAddressesMap.get(key);
          if (!addressId) {
            logger.error(
              "Failed to retrieve address ID for a processed address",
              { ...logData, key }
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve address ID for a processed address.",
            });
          }
          resultAddressIds.push(addressId);
        }
        logger.info("Successfully processed bulk addresses", {
          ...logData,
          resultCount: resultAddressIds.length,
        });
        return resultAddressIds;
      } catch (error) {
        logger.error("Failed during bulk address processing", {
          ...logData,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong during bulk address processing.",
        });
      }
    }),
});
