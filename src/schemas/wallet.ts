import { z } from "zod";

export const addFundsSchema = z.object({
  amount: z.number(),
});

export const paymentSuccessSchema = z.object({
  transaction_id: z.string(),
});
