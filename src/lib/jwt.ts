import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { env } from "~/env";

interface JwtUserPayload {
  id: string;
  role: string;
}

export const signToken = (payload: JwtUserPayload) => {
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtUserPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET as string) as JwtPayload;

  if (typeof decoded === "object" && "id" in decoded && "role" in decoded) {
    return {
      id: decoded.id as string,
      role: decoded.role as string,
    };
  }

  throw new Error("Invalid token payload");
};
