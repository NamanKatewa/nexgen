import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { rateSchema } from "~/schemas/rate";

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
      let userRate;
      if (userId) {
        userRate = await db.userRate.findFirst({
          where: {
            user_id: userId,
            zone_from: "z",
            zone_to: zone,
            weight_slab: weightSlab,
          },
        });

        if (userRate) {
          return userRate.rate;
        }
      }

      const defaultRate = await db.defaultRate.findFirst({
        where: {
          zone_from: "z",
          zone_to: zone,
          weight_slab: weightSlab,
        },
      });

      if (defaultRate) {
        return defaultRate.rate;
      }

      if (userId) {
        const lowerUserRate = await db.userRate.findFirst({
          where: {
            user_id: userId,
            zone_from: "z",
            zone_to: zone,
            weight_slab: {
              lt: weightSlab,
            },
          },
          orderBy: {
            weight_slab: "desc",
          },
        });

        const upperUserRate = await db.userRate.findFirst({
          where: {
            user_id: userId,
            zone_from: "z",
            zone_to: zone,
            weight_slab: {
              gt: weightSlab,
            },
          },
          orderBy: {
            weight_slab: "asc",
          },
        });

        if (lowerUserRate && upperUserRate) {
          const rateDiff = upperUserRate.rate - lowerUserRate.rate;
          const weightDiff =
            upperUserRate.weight_slab - lowerUserRate.weight_slab;
          if (weightDiff <= 0) {
            const ratePerKg = lowerUserRate.rate / lowerUserRate.weight_slab;
            return ratePerKg * packageWeight;
          }
          const ratePerKgInRange = rateDiff / weightDiff;
          const weightAboveLower = packageWeight - lowerUserRate.weight_slab;
          const calculatedRate =
            lowerUserRate.rate + weightAboveLower * ratePerKgInRange;
          return calculatedRate;
        }

        if (lowerUserRate) {
          const ratePerKg = lowerUserRate.rate / lowerUserRate.weight_slab;
          return ratePerKg * packageWeight;
        }
      }

      const lowerDefaultRate = await db.defaultRate.findFirst({
        where: {
          zone_from: "z",
          zone_to: zone,
          weight_slab: {
            lt: weightSlab,
          },
        },
        orderBy: {
          weight_slab: "desc",
        },
      });

      const upperDefaultRate = await db.defaultRate.findFirst({
        where: {
          zone_from: "z",
          zone_to: zone,
          weight_slab: {
            gt: weightSlab,
          },
        },
        orderBy: {
          weight_slab: "asc",
        },
      });

      if (lowerDefaultRate && upperDefaultRate) {
        const rateDiff = upperDefaultRate.rate - lowerDefaultRate.rate;
        const weightDiff =
          upperDefaultRate.weight_slab - lowerDefaultRate.weight_slab;
        if (weightDiff <= 0) {
          const ratePerKg =
            lowerDefaultRate.rate / lowerDefaultRate.weight_slab;
          return ratePerKg * packageWeight;
        }
        const ratePerKgInRange = rateDiff / weightDiff;
        const weightAboveLower = packageWeight - lowerDefaultRate.weight_slab;
        const calculatedRate =
          lowerDefaultRate.rate + weightAboveLower * ratePerKgInRange;
        return calculatedRate;
      }

      if (lowerDefaultRate) {
        const ratePerKg = lowerDefaultRate.rate / lowerDefaultRate.weight_slab;
        return ratePerKg * packageWeight;
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Rate not found for the given parameters",
      });
    }),
});
