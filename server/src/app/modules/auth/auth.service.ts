import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelper/appError.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";

export interface JwtPayload {
  sub: string;   // userId
  role: string;
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

export const signToken = (userId: string, role: string): string =>
  jwt.sign({ sub: userId, role }, envVars.JWT_SECRET, {
    expiresIn: envVars.JWT_EXPIRES_IN as unknown as number,
  });

// ── signup ─────────────────────────────────────────────────────────────────────
export const signup = async (input: SignupInput) => {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "Email already in use.");
  }

  const saltRounds = Number(envVars.BCRYPT_SALT_ROUNDS);
  const password = await bcrypt.hash(input.password, saltRounds);

  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, password, role: "STUDENT" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signToken(user.id, user.role);
  return { user, token };
};

// login 
export const login = async (input: LoginInput) => {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  const INVALID = new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials.");

  // Always run bcrypt to prevent timing attacks
  const passwordToCheck = user?.password ?? "$2b$10$invalidhashpadding000000000000000000000000000000000000";
  const match = await bcrypt.compare(input.password, passwordToCheck);

  if (!user || !match) throw INVALID;

  const token = signToken(user.id, user.role);
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

export { COOKIE_OPTS };
