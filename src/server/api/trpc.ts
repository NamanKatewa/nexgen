import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { verifyToken } from "~/lib/jwt";
import logger from "~/lib/logger";

import { db } from "~/server/db";

export const createTRPCContext = async (opts: {
	headers: Headers;
	req: Request;
}) => {
	const token = opts.headers.get("authorization")?.replace("Bearer ", "");
	let user = null;

	if (token) {
		try {
			const payload = verifyToken(token);

			const baseUser = await db.user.findUnique({
				where: { user_id: payload.id },
				select: {
					user_id: true,
					email: true,
					role: true,
					name: true,
					status: true,
				},
			});
			let kycStatus = null;
			try {
				const kyc = await db.kyc.findUnique({
					where: { user_id: baseUser?.user_id },
					select: { kyc_status: true },
				});
				kycStatus = kyc?.kyc_status;
			} catch (kycError) {
				logger.error("Failed to fetch KYC status for user", {
					userId: baseUser?.user_id,
					kycError,
				});
			}

			user = { ...baseUser, kyc_status: kycStatus };
		} catch (error) {
			logger.error("Invalid token", { error });
		}
	}

	return {
		db,
		user,
		logger,
		...opts,
	};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			message: error.message, // Ensure the error message is passed through
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
	const start = Date.now();
	const result = await next();
	const duration = Date.now() - start;

	const { user, logger } = ctx;

	const logData = {
		path,
		type,
		duration,
		user: user
			? { id: user.user_id, email: user.email, role: user.role }
			: null,
		status: result.ok ? "success" : "error",
	};

	if (result.ok) {
		logger.info(`[TRPC] ${path} - OK`, logData);
	} else {
		logger.error(`[TRPC] ${path} - Error`, { ...logData, error: result.error });
	}

	return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to access this resource",
			});
		}

		type AuthContext = typeof ctx & {
			user: NonNullable<typeof ctx.user>;
		};
		return next({
			ctx: {
				...ctx,
				user: ctx.user as AuthContext["user"],
			},
		});
	});

export const adminProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to access this resource",
			});
		}

		if (ctx.user.role !== "Admin") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only admins can access this resource",
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});
