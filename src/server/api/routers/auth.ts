import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { addMinutes } from "date-fns";
import { cookies } from "next/headers";
import { sendEmail } from "~/lib/email";
import { signToken } from "~/lib/jwt";
import logger from "~/lib/logger";
import { generateOTP } from "~/lib/utils";
import {
	forgotPasswordSchema,
	loginSchema,
	resetPasswordWithOtpSchema,
	signupSchema,
} from "~/schemas/auth";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const authRouter = createTRPCRouter({
	me: publicProcedure.query(async ({ ctx }) => {
		const { user } = ctx;
		if (!user) {
			return null;
		}

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

			return result;
		} catch (error) {
			logger.error("auth.me", { ctx, error });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong",
			});
		}
	}),

	signup: publicProcedure
		.input(signupSchema)
		.mutation(async ({ input, ctx }) => {
			const userExists = await db.user.findUnique({
				where: { email: input.email },
				select: {},
			});
			if (userExists) {
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
					select: {
						user_id: true,
						role: true,
						email: true,
						name: true,
						status: true,
					},
				});

				const dummyAddress = await db.address.create({
					data: {
						user_id: user.user_id,
						zip_code: 0,
						city: "N/A",
						state: "N/A",
						address_line: "N/A",
						name: "N/A",
						type: "User",
					},
				});

				const kyc = await db.kyc.create({
					data: {
						user: { connect: { user_id: user.user_id } },
						address: { connect: { address_id: dummyAddress.address_id } },
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

				return {
					token,
					user: tokenPayload,
				};
			} catch (error) {
				logger.error("auth.signup", { ctx, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
		const user = await db.user.findUnique({
			where: { email: input.email },
			select: {
				password_hash: true,
				user_id: true,
				role: true,
				name: true,
				email: true,
				status: true,
			},
		});

		if (!user || !user.password_hash) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Invalid email",
			});
		}

		const isValidPass = await compare(input.password, user.password_hash);
		if (!isValidPass) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Invalid password",
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
			return {
				token,
				user: tokenPayload,
			};
		} catch (error) {
			logger.error("auth.login", { ctx, input, error });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong",
			});
		}
	}),

	logout: publicProcedure.mutation(async () => {
		try {
			(await cookies()).set({ name: "token", value: "", maxAge: 0, path: "/" });
			return true;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong",
			});
		}
	}),

	forgotPassword: publicProcedure
		.input(forgotPasswordSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await db.user.findUnique({
				where: { email: input.email },
				select: { email: true },
			});
			if (!user) {
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

				return true;
			} catch (error) {
				logger.error("auth.forgotPassword", {
					ctx,
					input,
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
		.mutation(async ({ ctx, input }) => {
			try {
				const record = await db.passwordReset.findUnique({
					where: { email: input.email },
				});

				if (!record || record.otp !== input.otp) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid or expired OTP",
					});
				}

				if (record.expiresAt < new Date()) {
					throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" });
				}

				const hashedPassword = await hash(input.password, 10);

				await db.user.update({
					where: { email: input.email },
					data: { password_hash: hashedPassword },
				});

				await db.passwordReset.delete({ where: { email: input.email } });

				return true;
			} catch (error) {
				logger.error("auth.resetPasswordWithOtp", { ctx, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
