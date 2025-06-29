import { z } from "zod";
import { addressSchema } from "./address";

export const shipmentSchema = z.object({
  carrier_id: z.string().optional(),
  recipient_name: z.string(),
  recipient_mobile: z.string(),
  package_weight: z.number(),
  package_dimensions: z.string(),
  origin_address: addressSchema,
  destination_address: addressSchema,
});

export const orderSchema = z.object({
  shipments: z.array(shipmentSchema),
  is_bulk_order: z.boolean().default(false),
});

export type Order = z.infer<typeof orderSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;