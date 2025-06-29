import { rejectKycSchema, verifyKycSchema } from "~/schemas/kyc";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { sendEmail } from "~/lib/email";

export const adminRouter = createTRPCRouter({
  pendingKyc: adminProcedure.query(async () => {
    const pending = await db.kyc.findMany({
      where: {
        kyc_status: "Submitted",
      },
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
      if (!kyc) return false;

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
        console.log(error);
        throw new Error("You are not logged in");
      }
    }),
  rejectKyc: adminProcedure
    .input(rejectKycSchema)
    .mutation(async ({ input, ctx }) => {
      const kyc = await db.kyc.findUnique({
        where: { kyc_id: input.kycId },
        include: { user: { select: { email: true } } },
      });
      if (!kyc) return false;

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
        console.log(error);
        throw new Error("You are not logged in");
      }
    }),

  getTransactions: adminProcedure.query(async () => {
    const transactions = await db.transaction.findMany({
      where: { transaction_type: "Credit" },
      include: { user: { select: { name: true, email: true } } },
    });
    return transactions;
  }),
  getPassbook: adminProcedure.query(async () => {
    const transactions = await db.transaction.findMany({
      orderBy: {
        transaction_date: "desc",
      },
      select: {
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
