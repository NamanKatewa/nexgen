import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  mobileNumber: z.string().min(10).max(10),
  password: z.string().min(6),
  name: z.string().min(1),
  companyName: z.string(),
  monthlyOrder: z.string(),
  businessType: z.enum(["Retailer", "Ecommerce", "Franchise"]),
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
