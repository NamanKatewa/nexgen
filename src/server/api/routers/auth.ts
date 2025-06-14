import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { signupSchema, loginSchema } from "~/schemas/auth";
import { hash, compare } from "bcryptjs";
import { db } from "~/server/db";
import { signToken } from "~/lib/jwt";

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    return {
      id: ctx.user.user_id,
      email: ctx.user.email,
      role: ctx.user.role,
      name: ctx.user.name,
      status: ctx.user.status,
    };
  }),

  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const userExists = await db.user.findUnique({
      where: { email: input.email },
    });
    if (userExists) throw new Error("User already exists");

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

    const token = signToken({
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
    });
    return {
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
      },
    };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const user = await db.user.findUnique({ where: { email: input.email } });

    if (!user || !user.password_hash) throw new Error("Invalid credentials");

    const isValidPass = await compare(input.password, user.password_hash);
    if (!isValidPass) throw new Error("Invalid credentials");

    const token = signToken({
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
    });
    return {
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        status: user.status,
      },
    };
  }),
});
