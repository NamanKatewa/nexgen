import logger from "~/lib/logger";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "~/lib/email";
import { rejectKycSchema, verifyKycSchema } from "~/schemas/kyc";
import { approveOrderSchema, rejectOrderSchema } from "~/schemas/order";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";

export const adminRouter = createTRPCRouter({
  pendingKyc: adminProcedure.query(async ({ ctx }) => {
    logger.info("Fetching pending KYC submissions");
    try {
      const pending = await db.kyc.findMany({
        where: {
          kyc_status: "Submitted",
        },
        include: { address: true, user: { select: { email: true } } },
        orderBy: { submission_date: "desc" },
      });

      logger.info("Successfully fetched pending KYC submissions", {
        count: pending.length,
      });
      if (!pending) return [];
      return pending;
    } catch (error) {
      logger.error("Failed to fetch pending KYC submissions", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),
  verifyKyc: adminProcedure
    .input(verifyKycSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = { kycId: input.kycId, adminId: ctx.user.user_id };
      logger.info("Verifying KYC", logData);

      const kyc = await db.kyc.findUnique({
        where: { kyc_id: input.kycId },
        include: { user: { select: { email: true } } },
      });
      if (!kyc) {
        logger.warn("KYC not found for verification", logData);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC not found",
        });
      }

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

        logger.info("Successfully verified KYC", logData);
        return true;
      } catch (error) {
        logger.error("Failed to verify KYC", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  rejectKyc: adminProcedure
    .input(rejectKycSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = {
        kycId: input.kycId,
        adminId: ctx.user.user_id,
        reason: input.reason,
      };
      logger.info("Rejecting KYC", logData);

      const kyc = await db.kyc.findUnique({
        where: { kyc_id: input.kycId },
        include: { user: { select: { email: true } } },
      });
      if (!kyc) {
        logger.warn("KYC not found for rejection", logData);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC not found",
        });
      }

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
        logger.info("Successfully rejected KYC", logData);
        return true;
      } catch (error) {
        logger.error("Failed to reject KYC", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  getTransactions: adminProcedure.query(async ({ ctx }) => {
    logger.info("Fetching all credit transactions");
    try {
      const transactions = await db.transaction.findMany({
        where: {
          transaction_type: "Credit",
          description: "Funds added to wallet",
        },
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
          created_at: true,
        },
      });
      logger.info("Successfully fetched all credit transactions", {
        count: transactions.length,
      });
      return transactions;
    } catch (error) {
      logger.error("Failed to fetch credit transactions", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),
  getPassbook: adminProcedure.query(async ({ ctx }) => {
    logger.info("Fetching admin passbook");
    try {
      const transactions = await db.transaction.findMany({
        orderBy: {
          created_at: "desc",
        },
        select: {
          transaction_id: true,
          created_at: true,
          amount: true,
          transaction_type: true,
          payment_status: true,
          description: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      logger.info("Successfully fetched admin passbook", {
        count: transactions.length,
      });
      return transactions;
    } catch (error) {
      logger.error("Failed to fetch admin passbook", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),
  pendingOrders: adminProcedure.query(async ({ ctx }) => {
    logger.info("Fetching pending orders");
    try {
      const orders = await db.order.findMany({
        where: { order_status: "PendingApproval" },
        include: {
          shipments: {
            include: { origin_address: true, destination_address: true },
          },
          user: { select: { email: true, name: true } },
        },
      });
      logger.info("Successfully fetched pending orders", {
        count: orders.length,
      });
      return orders;
    } catch (error) {
      logger.error("Failed to fetch pending orders", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),

  approveOrder: adminProcedure
    .input(approveOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = { orderId: input.orderId, adminId: ctx.user.user_id };
      logger.info("Approving order", logData);

      const order = await db.order.findUnique({
        where: { order_id: input.orderId },
        include: { user: { select: { email: true } } },
      });
      if (!order) {
        logger.warn("Order not found for approval", logData);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      try {
        await db.order.update({
          where: { order_id: order.order_id },
          data: {
            order_status: "Approved",
          },
        });
        logger.info("Successfully approved order", logData);
        return true;
      } catch (error) {
        logger.error("Failed to approve order", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  rejectOrder: adminProcedure
    .input(rejectOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = {
        orderId: input.orderId,
        adminId: ctx.user.user_id,
        reason: input.reason,
      };
      logger.info("Rejecting order", logData);

      const order = await db.order.findUnique({
        where: { order_id: input.orderId },
        include: { user: { select: { email: true } } },
      });
      if (!order) {
        logger.warn("Order not found for rejection", logData);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      try {
        await db.$transaction(async (prisma) => {
          await prisma.order.update({
            where: { order_id: order.order_id },
            data: {
              order_status: "Rejected",
              rejection_reason: input.reason,
            },
          });

          await prisma.transaction.create({
            data: {
              user_id: order.user_id,
              transaction_type: "Credit",
              payment_status: "Completed",
              amount: order.total_amount,
              description: "Refund for rejected order",
            },
          });

          await prisma.wallet.update({
            where: { user_id: order.user_id },
            data: {
              balance: {
                increment: order.total_amount,
              },
            },
          });
        });
        logger.info("Successfully rejected order and refunded user", logData);
        return true;
      } catch (error) {
        logger.error("Failed to reject order", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
