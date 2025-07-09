import { BUSINESS_TYPE } from "@prisma/client";
import { z } from "zod";

export const signupSchema = z
	.object({
		email: z.string().email("Invalid Email Address"),
		mobileNumber: z.string().length(10, "Should be 10 Digits"),
		password: z.string().min(6, "Password must be atleast 6 characters long"),
		confirmPassword: z
			.string()
			.min(6, "Password must be atleast 6 characters long"),
		name: z.string().min(1, "Name is Required"),
		companyName: z.string().min(1, "Company Name is Required"),
		monthlyOrder: z.string().min(1, "Amount of Orders is Required"),
		businessType: z.nativeEnum(BUSINESS_TYPE, {
			required_error: "Business Type is Required",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const loginSchema = z.object({
	email: z.string().email("Invalid Email Address"),
	password: z.string().min(6, "Password must be atleast 6 characters long"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid Email Address"),
});

export const resetPasswordWithOtpSchema = z.object({
	email: z.string().email("Invalid Email Address"),
	otp: z.string().length(6, "6 Digits OTP"),
	password: z.string().min(6, "Password must be atleast 6 characters long"),
});

export type TLoginSchema = z.infer<typeof loginSchema>;
export type TSignupSchema = z.infer<typeof signupSchema>;
export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type TResetPasswordWithOtpSchema = z.infer<
	typeof resetPasswordWithOtpSchema
>;
