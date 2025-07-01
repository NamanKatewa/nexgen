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
		if (!ctx.user) return null;

		const wallet = await db.wallet.findUnique({
			where: { user_id: ctx.user.user_id },
			select: { balance: true },
		});

		return {
			id: ctx.user.user_id,
			email: ctx.user.email,
			role: ctx.user.role,
			name: ctx.user.name,
			status: ctx.user.status,
			walletBalance: wallet?.balance,
		};
	}),

	signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
		const userExists = await db.user.findUnique({
			where: { email: input.email },
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

		const token = signToken({
			id: user.user_id,
			role: user.role,
			email: user.email,
			name: user.name,
			status: user.status,
			kyc_status: kyc.kyc_status,
		});

		(await cookies()).set({
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
		const user = await db.user.findUnique({ where: { email: input.email } });

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
			where: {
				user_id: user.user_id,
			},
			select: { kyc_status: true },
		});

		if (!kyc)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Invalid KYC",
			});

		const token = signToken({
			id: user.user_id,
			role: user.role,
			email: user.email,
			name: user.name,
			status: user.status,
			kyc_status: kyc.kyc_status,
		});

		(await cookies()).set({
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
		(await cookies()).set({ name: "token", value: "", maxAge: 0, path: "/" });
		return true;
	}),

	forgotPassword: publicProcedure
		.input(forgotPasswordSchema)
		.mutation(async ({ input }) => {
			const user = await db.user.findUnique({ where: { email: input.email } });
			if (!user)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No user with this email.",
				});

			const otp = generateOTP();
			const expiry = addMinutes(new Date(), 10);

			const reset = await db.passwordReset.upsert({
				where: { email: input.email },
				update: { otp, expiresAt: expiry },
				create: { email: input.email, otp, expiresAt: expiry },
			});

			if (!reset)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Database Error",
				});

			const mail = await sendEmail({
				to: user.email,
				subject: "Password Reset OTP",
				html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
			});

			if (mail) return true;
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something Went Wrong.",
			});
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
