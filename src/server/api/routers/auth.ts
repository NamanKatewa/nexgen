import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
} from "~/schemas/auth";
import { hash, compare } from "bcryptjs";
import { db } from "~/server/db";
import { signToken } from "~/lib/jwt";
import { cookies } from "next/headers";
import { sendEmail } from "~/lib/email";
import { generateOTP } from "~/lib/utils";
import { addMinutes } from "date-fns";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) return null;

    return {
      id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
    };
  }),

  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const userExists = await db.user.findUnique({
      where: { email: input.email },
      select: { user_id: true },
    });

    if (userExists)
      throw new TRPCError({ code: "CONFLICT", message: "User already exists" });

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
      data: { user: { connect: { user_id: user.user_id } } },
      select: { kyc_status: true },
    });

    const token = signToken({
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
      kyc_status: kyc.kyc_status,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
        kyc_status: kyc.kyc_status,
      },
    };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const user = await db.user.findUnique({
      where: { email: input.email },
      select: {
        user_id: true,
        email: true,
        role: true,
        name: true,
        status: true,
        password_hash: true,
      },
    });

    if (!user || !user.password_hash)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });

    const isValidPass = await compare(input.password, user.password_hash);
    if (!isValidPass)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });

    const kyc = await db.kyc.findUnique({
      where: { user_id: user.user_id },
      select: { kyc_status: true },
    });

    if (!kyc)
      throw new TRPCError({ code: "FORBIDDEN", message: "Invalid KYC" });

    const token = signToken({
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
      kyc_status: kyc.kyc_status,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
        kyc_status: kyc.kyc_status,
      },
    };
  }),

  logout: protectedProcedure.mutation(async () => {
    const cookieStore = await cookies();
    cookieStore.set({ name: "token", value: "", maxAge: 0, path: "/" });
    return true;
  }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: { email: true },
      });

      if (!user)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user with this email.",
        });

      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10);

      await db.passwordReset.upsert({
        where: { email: input.email },
        update: { otp, expiresAt },
        create: { email: input.email, otp, expiresAt },
      });

      const sent = await sendEmail({
        to: user.email,
        subject: "Password Reset OTP",
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });

      if (!sent)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email failed to send.",
        });

      return true;
    }),

  resetPasswordWithOtp: publicProcedure
    .input(resetPasswordWithOtpSchema)
    .mutation(async ({ input }) => {
      const record = await db.passwordReset.findUnique({
        where: { email: input.email },
      });

      if (!record || record.otp !== input.otp)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired OTP",
        });

      if (record.expiresAt < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" });

      const hashedPassword = await hash(input.password, 10);

      await db.user.update({
        where: { email: input.email },
        data: { password_hash: hashedPassword },
      });

      await db.passwordReset.delete({ where: { email: input.email } });

      return true;
    }),
});
