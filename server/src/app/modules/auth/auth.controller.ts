import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../util/catchAsync.js";
import { sendResponse } from "../../util/sendResponse.js";
import * as authService from "./auth.service.js";
import { COOKIE_OPTS } from "./auth.service.js";

// POST /auth/signup
export const signup = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.signup(req.body);

  res.cookie("token", token, COOKIE_OPTS);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Account created successfully.",
    data: user,
  });
});

// POST /auth/login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);

  res.cookie("token", token, COOKIE_OPTS);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully.",
    data: user,
  });
});

// POST /auth/logout
export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully.",
    data: null,
  });
});

// GET /auth/me
export const me = catchAsync(async (req: Request, res: Response) => {
  // req.user is set by authenticate middleware
  const userId = (req as any).user.sub as string;

  const { prisma } = await import("../../lib/prisma.js");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully.",
    data: user,
  });
});
