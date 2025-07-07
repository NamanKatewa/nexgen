import { submitShipmentSchema } from "~/schemas/order";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateShipmentId } from "~/lib/utils";
import { uploadFileToS3 } from "~/lib/s3";
import { getPincodeDetails } from "~/lib/rate-calculator";
import { db } from "~/server/db";

export const orderRouter = createTRPCRouter({
  createShipment: protectedProcedure
    .input(submitShipmentSchema)
    .mutation(async ({ ctx, input }) => {
      const addresses = await db.address.findMany({
        where: {
          address_id: {
            in: [input.originAddressId, input.destinationAddressId],
          },
        },
      });
      console.log(addresses);

      // const packageImageUrl = await uploadFileToS3(
      //   input.packageImage,
      //   "order/"
      // );

      const human_readable_shipment_id = generateShipmentId(ctx.user.user_id);

      return {
        success: true,
        message: "Shipment created successfully",
        shipmentId: human_readable_shipment_id,
      };
    }),
});
