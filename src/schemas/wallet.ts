import { z } from "zod";

export const rechargeWalletSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().min(1),
});

export type RechargeWalletInput = z.infer<typeof rechargeWalletSchema>;
