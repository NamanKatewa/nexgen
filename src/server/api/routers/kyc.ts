import { submitKycSchema } from "~/schemas/kyc";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { uploadFileToS3 } from "~/lib/s3";

export const kycRouter = createTRPCRouter({
  kycSubmit: protectedProcedure
    .input(submitKycSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) return null;

      if (
        !input.aadharImageFront ||
        !input.aadharImageBack ||
        !input.panImageFront ||
        !input.panImageBack
      ) {
        throw new Error("All image files must be provided.");
      }

      const [aadharFrontUrl, aadharBackUrl, panFrontUrl, panBackUrl] =
        await Promise.all([
          uploadFileToS3(input.aadharImageFront, "kyc/aadhar/front"),
          uploadFileToS3(input.aadharImageBack, "kyc/aadhar/back"),
          uploadFileToS3(input.panImageFront, "kyc/pan/front"),
          uploadFileToS3(input.panImageBack, "kyc/pan/back"),
        ]);

      try {
        await db.kyc.update({
          where: { user_id: ctx.user.user_id },
          data: {
            entity_name: input.entityName,
            entity_type: input.entityType,
            website_url: input.websiteUrl,
            billing_address: {
              zip_code: input.billingAddress.zipCode,
              city: input.billingAddress.city,
              state: input.billingAddress.state,
              address_line: input.billingAddress.addressLine,
            },
            aadhar_number: input.aadharNumber,
            aadhar_image_front: aadharFrontUrl,
            aadhar_image_back: aadharBackUrl,
            pan_number: input.panNumber,
            pan_image_front: panFrontUrl,
            pan_image_back: panBackUrl,
            gst: input.gst,
            kyc_status: "Submitted",
            submission_date: new Date(),
          },
        });

        return null;
      } catch (error) {
        console.log(error);
        throw new Error("You are not logged in");
      }
    }),
});
