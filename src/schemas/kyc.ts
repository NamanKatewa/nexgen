import { ENTITY_TYPE } from "@prisma/client";
import { z } from "zod";
import { base64ImageSchema } from "~/schemas/image";

export const submitKycSchema = z
	.object({
		entityName: z.string().min(1, "Entity name is required"),
		entityType: z.nativeEnum(ENTITY_TYPE, {
			required_error: "Entity type is required",
		}),
		websiteUrl: z
			.string()
			.trim()
			.optional()
			.nullable()
			.refine((val) => !val || /^https?:\/\/.+\..+/.test(val), {
				message: "Enter a valid URL",
			}),

		billingAddress: z.object({
			zipCode: z
				.number()
				.min(100000, "Zip Code must be 6 digits")
				.max(999999, "Zip Code must be 6 digits"),
			city: z.string().min(1, "City is required"),
			state: z.string().min(1, "State is required"),
			addressLine: z.string().min(1, "Address is required"),
		}),
		aadharNumber: z
			.string()
			.length(12, "Aadhar number must be exactly 12 digits"),
		aadharImageFront: base64ImageSchema,
		aadharImageBack: base64ImageSchema,
		panNumber: z
			.string()
			.regex(
				/^[A-Z]{5}[0-9]{4}[A-Z]$/,
				"PAN number must be in the format: 5 letters, 4 digits, 1 letter",
			),
		panImageFront: base64ImageSchema,
		panImageBack: base64ImageSchema,
		gst: z.boolean(),
		submission_date: z.date(),
	})
	.superRefine((data, ctx) => {
		if (!data.aadharImageFront) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Aadhar Front Image is required.",
				path: ["aadharImageFront"],
			});
		}
		if (!data.aadharImageBack) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Aadhar Back Image is required.",
				path: ["aadharImageBack"],
			});
		}

		if (!data.panImageFront) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "PAN Front Image is required.",
				path: ["panImageFront"],
			});
		}
		if (!data.panImageBack) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "PAN Back Image is required.",
				path: ["panImageBack"],
			});
		}
	});

export const verifyKycSchema = z.object({
	kycId: z.string().min(1),
});

export const rejectKycSchema = z.object({
	kycId: z.string().min(1),
	reason: z.string(),
});

export type TKycSchema = z.infer<typeof submitKycSchema>;
export type TKycVerifySchema = z.infer<typeof verifyKycSchema>;
export type TKycRejectSchema = z.infer<typeof rejectKycSchema>;
