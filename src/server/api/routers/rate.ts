import { TRPCError } from "@trpc/server";
import { findRate } from "~/lib/rate";
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
});
