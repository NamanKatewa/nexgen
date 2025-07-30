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
			try {
				const [aadharFrontUrl, aadharBackUrl, panFrontUrl] = await Promise.all([
					uploadFileToS3(input.aadharImageFront, "kyc/aadhar/front"),
					uploadFileToS3(input.aadharImageBack, "kyc/aadhar/back"),
					uploadFileToS3(input.panImageFront, "kyc/pan/front"),
				]);

				const existingKyc = await db.kyc.findUnique({
					where: { user_id: ctx.user.user_id },
					select: { address_id: true },
				});

				if (!existingKyc || !existingKyc.address_id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "KYC record or associated address not found.",
					});
				}

				const address = await db.address.update({
					where: { address_id: existingKyc.address_id },
					data: {
						type: "Warehouse",
						zip_code: input.billingAddress.zipCode,
						city: input.billingAddress.city,
						state: input.billingAddress.state,
						address_line: input.billingAddress.addressLine,
						landmark: input.billingAddress.landmark || null,
						name: "KYC",
					},
					select: { address_id: true },
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
						gst: input.gst,
						kyc_status: "Submitted",
						submission_date: new Date(),
					},
				});

				return null;
			} catch (error) {
				logger.error("kyc.kycSubmit", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
