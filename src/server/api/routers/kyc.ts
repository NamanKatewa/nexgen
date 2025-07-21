import { TRPCError } from "@trpc/server";
import logger from "~/lib/logger";
import { uploadFileToS3 } from "~/lib/s3";
import { submitKycSchema } from "~/schemas/kyc";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const kycRouter = createTRPCRouter({
	kycSubmit: protectedProcedure
		.input(submitKycSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = { userId: ctx.user.user_id };
			logger.info("KYC submission attempt", logData);

			try {
				const [aadharFrontUrl, aadharBackUrl, panFrontUrl, panBackUrl] =
					await Promise.all([
						uploadFileToS3(input.aadharImageFront, "kyc/aadhar/front"),
						uploadFileToS3(input.aadharImageBack, "kyc/aadhar/back"),
						uploadFileToS3(input.panImageFront, "kyc/pan/front"),
						uploadFileToS3(input.panImageBack, "kyc/pan/back"),
					]);
				logger.info("Successfully uploaded KYC documents to S3", logData);

				const address = await db.address.create({
					data: {
						type: "Warehouse",
						zip_code: input.billingAddress.zipCode,
						city: input.billingAddress.city,
						state: input.billingAddress.state,
						address_line: input.billingAddress.addressLine,
						landmark: input.billingAddress.landmark || null,
						user: { connect: { user_id: ctx.user.user_id } },
						name: "KYC",
					},
				});
				logger.info("Successfully created KYC address", {
					...logData,
					addressId: address.address_id,
				});

				await db.kyc.update({
					where: { user_id: ctx.user.user_id },
					data: {
						entity_name: input.entityName,
						entity_type: input.entityType,
						website_url: input.websiteUrl,
						address_id: address.address_id,
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

				logger.info("Successfully submitted KYC", logData);
				return null;
			} catch (error) {
				logger.error("KYC submission failed", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
