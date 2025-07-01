import { TRPCError } from "@trpc/server";
import { sendEmail } from "~/lib/email";
import { rejectKycSchema, verifyKycSchema } from "~/schemas/kyc";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";

export const adminRouter = createTRPCRouter({
	pendingKyc: adminProcedure.query(async () => {
		const pending = await db.kyc.findMany({
			where: {
				kyc_status: "Submitted",
			},
			include: { address: true },
			orderBy: { submission_date: "desc" },
		});

		if (!pending) return [];
		return pending;
	}),
	verifyKyc: adminProcedure
		.input(verifyKycSchema)
		.mutation(async ({ input, ctx }) => {
			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "KYC not found",
				});

			try {
				await db.kyc.update({
					where: { kyc_id: kyc.kyc_id },
					data: {
						kyc_status: "Approved",
						verification_date: new Date(),
						verified_by_user_id: ctx.user.user_id,
					},
				});
				await sendEmail({
					to: kyc.user.email,
					subject: "KYC Verified",
					html: "Your KYC has been verified. Logout and Login again to start shipping.",
				});

				return true;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	rejectKyc: adminProcedure
		.input(rejectKycSchema)
		.mutation(async ({ input, ctx }) => {
			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "KYC not found",
				});

			try {
				await db.kyc.update({
					where: { kyc_id: kyc.kyc_id },
					data: {
						kyc_status: "Rejected",
						verification_date: new Date(),
						verified_by_user_id: ctx.user.user_id,
						rejection_reason: input.reason,
					},
				});
				await sendEmail({
					to: kyc.user.email,
					subject: "KYC Rejected",
					html: `Your KYC has been rejected for the following reason: ${input.reason}`,
				});
				return true;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getTransactions: adminProcedure.query(async () => {
		const transactions = await db.transaction.findMany({
			where: { transaction_type: "Credit" },
			select: {
				transaction_id: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},
				payment_status: true,
				transaction_type: true,
				amount: true,
				transaction_date: true,
			},
		});
		return transactions;
	}),
	getPassbook: adminProcedure.query(async () => {
		const transactions = await db.transaction.findMany({
			orderBy: {
				transaction_date: "desc",
			},
			select: {
				transaction_id: true,
				transaction_date: true,
				amount: true,
				transaction_type: true,
				payment_status: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
		});

		return transactions;
	}),
});
