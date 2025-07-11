import logger from "~/lib/logger";
import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { addMinutes } from "date-fns";
import { cookies } from "next/headers";
import { sendEmail } from "~/lib/email";
import { signToken } from "~/lib/jwt";
import { generateOTP } from "~/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordWithOtpSchema,
  signupSchema,
} from "~/schemas/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    if (!user) {
      logger.info("No user found in context for 'me' query");
      return null;
    }

    const logData = { userId: user.user_id };
    logger.info("Fetching user details for 'me' query", logData);

    try {
      const wallet = await db.wallet.findUnique({
        where: { user_id: user.user_id },
        select: { balance: true },
      });

      const result = {
        id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
        walletBalance: wallet?.balance,
      };

      logger.info("Successfully fetched user details", logData);
      return result;
    } catch (error) {
      logger.error("Failed to fetch user details", { ...logData, error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),

  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = { email: input.email };
      logger.info("User signup attempt", logData);

      const userExists = await db.user.findUnique({
        where: { email: input.email },
      });
      if (userExists) {
        logger.warn("User already exists", logData);
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      try {
        const passwordHash = await hash(input.password, 10);
        const user = await db.user.create({
          data: {
            name: input.name,
            email: input.email,
            mobile_number: input.mobileNumber,
            company_name: input.companyName,
            monthly_order: input.monthlyOrder,
            business_type: input.businessType,
            password_hash: passwordHash,
          },
        });

        const kyc = await db.kyc.create({
          data: {
            user: { connect: { user_id: user.user_id } },
          },
          select: { kyc_status: true },
        });

        await db.wallet.create({
          data: {
            user: { connect: { user_id: user.user_id } },
            balance: 0,
          },
        });

        const tokenPayload = {
          id: user.user_id,
          role: user.role,
          email: user.email,
          name: user.name,
          status: user.status,
          kyc_status: kyc.kyc_status,
        };
        const token = signToken(tokenPayload);

        (await cookies()).set({
          name: "token",
          value: token,
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        });

        logger.info("User signed up successfully", {
          ...logData,
          userId: user.user_id,
        });
        return {
          token,
          user: tokenPayload,
        };
      } catch (error) {
        logger.error("User signup failed", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const logData = { email: input.email };
    logger.info("User login attempt", logData);

    const user = await db.user.findUnique({ where: { email: input.email } });

    if (!user || !user.password_hash) {
      logger.warn(
        "Invalid credentials - user not found or no password hash",
        logData
      );
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    const isValidPass = await compare(input.password, user.password_hash);
    if (!isValidPass) {
      logger.warn("Invalid credentials - password mismatch", logData);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    try {
      const kyc = await db.kyc.findUnique({
        where: {
          user_id: user.user_id,
        },
        select: { kyc_status: true },
      });

      if (!kyc) {
        logger.error("KYC not found for user", {
          ...logData,
          userId: user.user_id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid KYC",
        });
      }

      const tokenPayload = {
        id: user.user_id,
        role: user.role,
        email: user.email,
        name: user.name,
        status: user.status,
        kyc_status: kyc.kyc_status,
      };
      const token = signToken(tokenPayload);

      (await cookies()).set({
        name: "token",
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });

      logger.info("User logged in successfully", {
        ...logData,
        userId: user.user_id,
      });
      return {
        token,
        user: tokenPayload,
      };
    } catch (error) {
      logger.error("User login failed", { ...logData, error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { logger, user } = ctx;
    const logData = { userId: user.user_id };
    logger.info("User logout", logData);
    try {
      (await cookies()).set({ name: "token", value: "", maxAge: 0, path: "/" });
      logger.info("User logged out successfully", logData);
      return true;
    } catch (error) {
      logger.error("User logout failed", { ...logData, error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = { email: input.email };
      logger.info("Forgot password request", logData);

      const user = await db.user.findUnique({ where: { email: input.email } });
      if (!user) {
        logger.warn("User not found for forgot password request", logData);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user with this email.",
        });
      }

      try {
        const otp = generateOTP();
        const expiry = addMinutes(new Date(), 10);

        await db.passwordReset.upsert({
          where: { email: input.email },
          update: { otp, expiresAt: expiry },
          create: { email: input.email, otp, expiresAt: expiry },
        });

        await sendEmail({
          to: user.email,
          subject: "Password Reset OTP",
          html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });

        logger.info("Successfully sent password reset OTP", logData);
        return true;
      } catch (error) {
        logger.error("Failed to send password reset OTP", {
          ...logData,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database Error",
        });
      }
    }),

  resetPasswordWithOtp: publicProcedure
    .input(resetPasswordWithOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const logData = { email: input.email };
      logger.info("Reset password with OTP attempt", logData);

      try {
        const record = await db.passwordReset.findUnique({
          where: { email: input.email },
        });

        if (!record || record.otp !== input.otp) {
          logger.warn("Invalid or expired OTP", logData);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired OTP",
          });
        }

        if (record.expiresAt < new Date()) {
          logger.warn("OTP expired", logData);
          throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" });
        }

        const hashedPassword = await hash(input.password, 10);

        await db.user.update({
          where: { email: input.email },
          data: { password_hash: hashedPassword },
        });

        await db.passwordReset.delete({ where: { email: input.email } });

        logger.info("Password reset successfully", logData);
        return true;
      } catch (error) {
        logger.error("Password reset failed", { ...logData, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
