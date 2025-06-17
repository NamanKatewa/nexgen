import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { verifyToken } from "~/lib/jwt";
import { db } from "~/server/db";

// Create context, memoize user extraction and fail silently in prod
export const createTRPCContext = async ({ headers }: { headers: Headers }) => {
  const token = headers.get("authorization")?.replace("Bearer ", "");
  let user = null;

  if (token) {
    try {
      const payload = verifyToken(token);

      const [baseUser, kyc] = await Promise.all([
        db.user.findUnique({
          where: { user_id: payload.id },
          select: {
            user_id: true,
            email: true,
            role: true,
            name: true,
            status: true,
          },
        }),
        db.kyc.findUnique({
          where: { user_id: payload.id },
          select: { kyc_status: true },
        }),
      ]);

      if (baseUser) {
        user = { ...baseUser, kyc_status: kyc?.kyc_status ?? null };
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid token:", err);
      }
    }
  }

  return {
    db,
    user,
    headers,
  };
};

// Init tRPC with transformer and Zod error formatting
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError =
      error.cause instanceof ZodError ? error.cause.flatten() : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Middleware with execution timing
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  // Add delay only in dev (simulate latency)
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((res) => setTimeout(res, waitMs));
  }

  const result = await next();
  const duration = Date.now() - start;

  if (t._config.isDev) {
    console.log(`[TRPC] ${path} took ${duration}ms`);
  }

  return result;
});

// Public procedure
export const publicProcedure = t.procedure.use(timingMiddleware);

// Protected procedure (auth)
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });

// Admin-only procedure
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

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
