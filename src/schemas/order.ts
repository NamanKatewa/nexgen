import { z } from "zod";
import { base64ImageSchema } from "~/schemas/image";

export const submitShipmentSchema = z.object({
	recipientName: z.string().min(1, "Name is Required"),
	recipientMobile: z.string().length(10, "Should be 10 Digits"),
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Weight must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs")
		.refine((val) => /^-?\d+(\.\d{1,2})?$/.test(val.toString()), {
			message: "Weight can have at most 2 decimal places",
		}),
	packageHeight: z
		.number({
			required_error: "Height is required",
			invalid_type_error: "Height must be an integer",
		})
		.int("Height must be an integer"),
	packageLength: z
		.number({
			required_error: "Length is required",
			invalid_type_error: "Length must be an integer",
		})
		.int("Length must be an integer"),
	packageBreadth: z
		.number({
			required_error: "Breadth is required",
			invalid_type_error: "Breadth must be an integer",
		})
		.int("Breadth must be an integer"),
	originAddressId: z.string({
		required_error: "Origin address is required",
	}),
	destinationAddressId: z.string({
		required_error: "Destination address is required",
	}),
	packageImage: base64ImageSchema.refine((data) => data.data.length > 0, {
		message: "Package image is required",
	}),
});

export const excelShipmentSchema = z.object({
	recipientName: z.string().min(1, "Name is Required"),
	recipientMobile: z.string().length(10, "Should be 10 Digits"),
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Weight must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs")
		.refine((val) => /^-?\d+(\.\d{1,2})?$/.test(val.toString()), {
			message: "Weight can have at most 2 decimal places",
		}),
	packageHeight: z
		.number({
			required_error: "Height is required",
			invalid_type_error: "Height must be an integer",
		})
		.int("Height must be an integer"),
	packageLength: z
		.number({
			required_error: "Length is required",
			invalid_type_error: "Length must be an integer",
		})
		.int("Length must be an integer"),
	packageBreadth: z
		.number({
			required_error: "Breadth is required",
			invalid_type_error: "Breadth must be an integer",
		})
		.int("Breadth must be an integer"),
	originAddressLine: z.string().min(1, "Origin Address Line is Required"),
	originZipCode: z.string().length(6, "Origin Zip Code must be 6 digits"),
	originCity: z.string().min(1, "Origin City is Required"),
	originState: z.string().min(1, "Origin State is Required"),
	destinationAddressLine: z
		.string()
		.min(1, "Destination Address Line is Required"),
	destinationZipCode: z
		.string()
		.length(6, "Destination Zip Code must be 6 digits"),
	destinationCity: z.string().min(1, "Destination City is Required"),
	destinationState: z.string().min(1, "Destination State is Required"),
	packageImage: base64ImageSchema.refine((data) => data.data.length > 0, {
		message: "Package image is required",
	}),
	calculatedRate: z.number().optional().nullable(),
});

export const orderSchema = z.object({
	shipments: z.array(submitShipmentSchema),
});

export const excelOrderSchema = z.object({
	shipments: z.array(excelShipmentSchema),
});

export const bulkShipmentItemSchema = excelShipmentSchema.omit({
	calculatedRate: true,
});

export const bulkShipmentsSchema = z.object({
	shipments: z.array(bulkShipmentItemSchema),
});

export type TOrderSchema = z.infer<typeof orderSchema>;
export type TExcelOrderSchema = z.infer<typeof excelOrderSchema>;
export type TShipmentSchema = z.infer<typeof submitShipmentSchema>;
export type TExcelShipmentSchema = z.infer<typeof excelShipmentSchema>;
export type TBulkShipmentItemSchema = z.infer<typeof bulkShipmentItemSchema>;
export type TBulkShipmentsSchema = z.infer<typeof bulkShipmentsSchema>;

export const approveOrderSchema = z.object({
	orderId: z.string(),
});

export const rejectOrderSchema = z.object({
	orderId: z.string(),
	reason: z.string().min(1, "Rejection reason is required"),
});
