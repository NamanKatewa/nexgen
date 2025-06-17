import { submitKycSchema } from "~/schemas/kyc";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { uploadFileToS3 } from "~/lib/s3";

export const kycRouter = createTRPCRouter({
  kycSubmit: protectedProcedure
    .input(submitKycSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) return null;

      const { aadharImageFront, aadharImageBack, panImageFront, panImageBack } =
        input;

      // Basic file validation before uploads
      if (
        !aadharImageFront ||
        !aadharImageBack ||
        !panImageFront ||
        !panImageBack
      ) {
        throw new Error("All image files must be provided.");
      }

      // Upload all images in parallel
      const [aadharFrontUrl, aadharBackUrl, panFrontUrl, panBackUrl] =
        await Promise.all([
          uploadFileToS3(aadharImageFront, "kyc/aadhar/front"),
          uploadFileToS3(aadharImageBack, "kyc/aadhar/back"),
          uploadFileToS3(panImageFront, "kyc/pan/front"),
          uploadFileToS3(panImageBack, "kyc/pan/back"),
        ]);

      // Attempt KYC update
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
            submission_date: new Date(Date.now()), // Slight GC/perf improvement
          },
        });

        return null;
      } catch (err) {
        console.error("[KYC_SUBMIT_ERROR]", err);
        throw new Error("Failed to submit KYC. Please try again.");
      }
    }),
});
