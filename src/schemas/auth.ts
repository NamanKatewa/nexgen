import { z } from "zod";
import { BUSINESS_TYPE } from "@prisma/client";

export const signupSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  mobileNumber: z.string().length(10, "Should be 10 Digits"),
  password: z.string().min(6, "Password is Required"),
  name: z.string().min(1, "Name is Required"),
  companyName: z.string().min(1, "Company Name is Required"),
  monthlyOrder: z.string().min(1, "Amount of Orders is Required"),
  businessType: z.nativeEnum(BUSINESS_TYPE, {
    required_error: "Business Type is Required",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  password: z.string().min(6, "Invalid Password"),
});

export type TLoginSchema = z.infer<typeof loginSchema>;
export type TSignupSchema = z.infer<typeof signupSchema>;
