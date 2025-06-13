import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { env } from "~/env";

type UserStatus = "Active" | "Inactive";

interface JwtUserPayload {
  id: string;
  role: string;
  email: string;
  name: string;
  status: UserStatus;
}

export const signToken = (payload: JwtUserPayload) => {
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtUserPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET as string) as JwtPayload;

  if (
    typeof decoded === "object" &&
    "id" in decoded &&
    "role" in decoded &&
    "email" in decoded &&
    "name" in decoded &&
    "status" in decoded
  ) {
    return {
      id: decoded.id as string,
      role: decoded.role as string,
      email: decoded.email as string,
      name: decoded.name as string,
      status: decoded.status as UserStatus,
    };
  }

  throw new Error("Invalid token payload");
};
