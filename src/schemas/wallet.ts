import { z } from "zod";

export const addFundsSchema = z.object({
	amount: z.number({
		required_error: "Amount is required",
		invalid_type_error: "Amount must be a number",
	}),
});

export const paymentSuccessSchema = z.object({
	transaction_id: z.string({
		required_error: "Transaction ID is required",
	}),
});
