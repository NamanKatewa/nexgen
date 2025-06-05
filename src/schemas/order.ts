import { z } from "zod";

export const createOrderSchema = z.object({
  user_id: z.string().uuid(),
  total_amount: z.number().min(0),
  is_bulk_order: z.boolean(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
