import { KYC_STATUS, USER_STATUS } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { env } from "~/env";
import logger from "~/lib/logger";

const jwtUserPayloadSchema = z.object({
  id: z.string(),
  role: z.string(),
  email: z.string().email(),
  name: z.string(),
  status: z.nativeEnum(USER_STATUS),
  kyc_status: z.nativeEnum(KYC_STATUS),
});

export type JwtUserPayload = z.infer<typeof jwtUserPayloadSchema>;

export const signToken = (payload: JwtUserPayload) => {
  logger.info("Signing JWT token", { payload });
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtUserPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as string) as JwtPayload;

    const parsed = jwtUserPayloadSchema.safeParse(decoded);

    if (!parsed.success) {
      logger.error("Invalid token payload", { error: parsed.error });
      throw new Error("Invalid token payload");
    }

    logger.info("Token verified successfully", { payload: parsed.data });
    return parsed.data;
  } catch (error) {
    logger.error("Error verifying token", { error });
    throw error;
  }
};
