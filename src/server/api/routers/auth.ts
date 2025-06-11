// import { createTRPCRouter, publicProcedure } from "../trpc";
// import { signupSchema, loginSchema } from "~/schemas/auth";
// import { hash } from "bcryptjs";
// import { db } from "~/server/db";
// import { signToken } from "~/lib/jwt";

// export const authRouter = createTRPCRouter({
//   signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
//     const { password, ...userData } = input;
//     const userExists = await db.user.findUnique({
//       where: { email: userData.email },
//     });
//     if (userExists) throw new Error("User already exists");

//     const passwordHash = await hash(password, 10);
//     const user = await db.user.create({
//       data: { ...userData, password_hash: passwordHash },
//     });

//     const token = signToken({ id: user.user_id, role: user.role });
//     return { token, user: { email: user.email, role: user.role } };
//   }),

//   login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
//     const user = await db.user.findUnique({ where: { email: input.email } });

//     if (!user || !user.password_hash) throw new Error("Invalid credentials");

//     const token = signToken({ id: user.user_id, role: user.role });
//     return { token, user: { email: user.email, role: user.role } };
//   }),
// });
