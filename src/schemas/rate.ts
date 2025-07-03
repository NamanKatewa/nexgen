import { z } from "zod";

export const rateSchema = z.object({
  packageWeight: z
    .number({
      required_error: "Weight is required",
      invalid_type_error: "Height must be a number",
    })
    .min(0, "Can't be lower than 0 Kg")
    .max(1000, "Can't be more than 1000 Kgs"),
  originZipCode: z
    .string()
    .length(6, "Zip Code must be 6 digits")
    .refine((val) => !Number.isNaN(Number(val)), "Zip Code must be a number"),
  destinationZipCode: z
    .string()
    .length(6, "Zip Code must be 6 digits")
    .refine((val) => !Number.isNaN(Number(val)), "Zip Code must be a number"),
});

export type TRateSchema = z.infer<typeof rateSchema>;
