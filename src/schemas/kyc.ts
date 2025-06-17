import { z } from "zod";
import { ENTITY_TYPE } from "@prisma/client";

// Reusable image schema (Base64 validation)
const base64ImageSchema = z.object({
  data: z.string().startsWith("data:image/", "Invalid image data format"),
  name: z.string().min(1, "File name is required"),
  type: z.string().startsWith("image/", "Invalid file type"),
  size: z.number().max(5 * 1024 * 1024, "Max file size is 5MB."),
});

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
      .refine(
        (val) => !val || /^https?:\/\/[\w.-]+\.\w{2,}(\/.*)?$/i.test(val),
        { message: "Enter a valid URL" }
      ),

    billingAddress: z.object({
      zipCode: z
        .number()
        .int()
        .min(100000, "Zip Code must be 6 digits")
        .max(999999, "Zip Code must be 6 digits"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      addressLine: z.string().min(1, "Address is required"),
    }),

    aadharNumber: z
      .string()
      .regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits"),
    aadharImageFront: base64ImageSchema.optional(),
    aadharImageBack: base64ImageSchema.optional(),

    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, {
      message:
        "PAN number must be in the format: 5 letters, 4 digits, 1 letter",
    }),
    panImageFront: base64ImageSchema.optional(),
    panImageBack: base64ImageSchema.optional(),

    gst: z.boolean(),
    submission_date: z.date(),
  })
  .superRefine((data, ctx) => {
    const requiredImages = [
      {
        key: "aadharImageFront",
        value: data.aadharImageFront,
        message: "Aadhar Front Image is required.",
      },
      {
        key: "aadharImageBack",
        value: data.aadharImageBack,
        message: "Aadhar Back Image is required.",
      },
      {
        key: "panImageFront",
        value: data.panImageFront,
        message: "PAN Front Image is required.",
      },
      {
        key: "panImageBack",
        value: data.panImageBack,
        message: "PAN Back Image is required.",
      },
    ];

    for (const { key, value, message } of requiredImages) {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [key],
        });
      }
    }
  });

// Verify + Reject schemas
export const verifyKycSchema = z.object({
  kycId: z.string().min(1, "KYC ID is required"),
});

export const rejectKycSchema = z.object({
  kycId: z.string().min(1, "KYC ID is required"),
  reason: z.string().min(1, "Rejection reason is required"),
});

// Types
export type TKycSchema = z.infer<typeof submitKycSchema>;
export type TKycVerifySchema = z.infer<typeof verifyKycSchema>;
export type TKycRejectSchema = z.infer<typeof rejectKycSchema>;
