import { z } from "zod";

export const submitShipmentSchema = z.object({
	recipientName: z.string().min(1, "Name is Required"),
	recipientMobile: z.string().length(10, "Should be 10 Digits"),
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Height must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs"),
	packageHeight: z.number({
		required_error: "Height is required",
		invalid_type_error: "Height must be a number",
	}),
	packageLength: z.number({
		required_error: "Length is required",
		invalid_type_error: "Length must be a number",
	}),
	packageBreadth: z.number({
		required_error: "Breadth is required",
		invalid_type_error: "Breadth must be a number",
	}),
	originAddressId: z.string({
		required_error: "Origin address is required",
	}),
	destinationAddressId: z.string().optional(),

	destinationAddressLine: z.string().min(1, "Address Line is Required"),
	destinationZipCode: z
		.string()
		.length(6, "Zip Code must be 6 digits")
		.refine((val) => !Number.isNaN(Number(val)), "Zip Code must be a number"),
	destinationCity: z.string().min(1, "City is Required"),
	destinationState: z.string().min(1, "State is Required"),
});

export const orderSchema = z.object({
	shipments: z.array(submitShipmentSchema),
});

export type TOrderSchema = z.infer<typeof orderSchema>;
export type TShipmentSchema = z.infer<typeof submitShipmentSchema>;
