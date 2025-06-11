import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  mobileNumber: z.number().min(10).max(10),
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(1),
  companyName: z.string(),
  monthlyOrder: z.string(),
  businessType: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const kycSchema = z.object({
  entityType: z.string(),
  websiteUrl: z.string(),
  zipCode: z.number().min(5).max(6),
});
