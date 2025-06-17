import { z } from "zod";
import { BUSINESS_TYPE } from "@prisma/client";

// Reusable email schema for consistency
const emailSchema = z.string().email("Invalid Email Address");

// Reusable password schema for consistency
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long");

export const signupSchema = z.object({
  email: emailSchema,
  mobileNumber: z
    .string()
    .regex(/^\d{10}$/, "Mobile number should be exactly 10 digits"),
  password: passwordSchema,
  name: z.string().min(1, "Name is required"),
  companyName: z.string().min(1, "Company name is required"),
  monthlyOrder: z.string().min(1, "Amount of orders is required"),
  businessType: z.nativeEnum(BUSINESS_TYPE, {
    required_error: "Business type is required",
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordWithOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: passwordSchema,
});

// Types
export type TLoginSchema = z.infer<typeof loginSchema>;
export type TSignupSchema = z.infer<typeof signupSchema>;
export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type TResetPasswordWithOtpSchema = z.infer<
  typeof resetPasswordWithOtpSchema
>;
