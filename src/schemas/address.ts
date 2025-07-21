import { z } from "zod";

export const addressSchema = z.object({
	zipCode: z
		.number({
			required_error: "Zip Code is required",
			invalid_type_error: "Zip Code must be a number",
		})
		.min(100000, "Zip Code must be 6 digits")
		.max(999999, "Zip Code must be 6 digits"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	addressLine: z.string().min(1, "Address is required"),
	landmark: z.string().optional(),
	name: z.string().min(1, "Name is required"),
});

export type TAddressSchema = z.infer<typeof addressSchema>;

export const approvePendingAddressSchema = z.object({
	pendingAddressId: z.string(),
});

export const rejectPendingAddressSchema = z.object({
	pendingAddressId: z.string(),
});
