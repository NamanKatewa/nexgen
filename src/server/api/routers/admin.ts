import { rejectKycSchema, verifyKycSchema } from "~/schemas/kyc";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { db } from "~/server/db";
import { sendEmail } from "~/lib/email";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  pendingKyc: adminProcedure.query(async () => {
    const pending = await db.kyc.findMany({
      where: { kyc_status: "Submitted" },
      orderBy: { submission_date: "desc" },
    });

    return pending ?? [];
  }),

  verifyKyc: adminProcedure
    .input(verifyKycSchema)
    .mutation(async ({ input, ctx }) => {
      const kyc = await db.kyc.findUnique({
        where: { kyc_id: input.kycId },
        select: {
          kyc_id: true,
          user: { select: { email: true } },
        },
      });

      if (!kyc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC not found",
        });
      }

      const now = new Date();

      await db.kyc.update({
        where: { kyc_id: kyc.kyc_id },
        data: {
          kyc_status: "Approved",
          verification_date: now,
          verified_by_user_id: ctx.user.user_id,
        },
      });

      await sendEmail({
        to: kyc.user.email,
        subject: "KYC Verified",
        html: "Your KYC has been verified. Logout and Login again to start shipping.",
      });

      return true;
    }),

  rejectKyc: adminProcedure
    .input(rejectKycSchema)
    .mutation(async ({ input, ctx }) => {
      const kyc = await db.kyc.findUnique({
        where: { kyc_id: input.kycId },
        select: {
          kyc_id: true,
          user: { select: { email: true } },
        },
      });

      if (!kyc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC not found",
        });
      }

      const now = new Date();

      await db.kyc.update({
        where: { kyc_id: kyc.kyc_id },
        data: {
          kyc_status: "Rejected",
          verification_date: now,
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
    }),
});
