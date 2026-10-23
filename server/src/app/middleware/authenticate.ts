import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { envVars } from "../config/env.js";
import AppError from "../errorHelper/appError.js";
import type { JwtPayload } from "../modules/auth/auth.service.js";

// Extend the Express Request type to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Authentication required."),
    );
  }

  try {
    const decoded = jwt.verify(token, envVars.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token."));
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(httpStatus.UNAUTHORIZED, "Authentication required."),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          httpStatus.FORBIDDEN,
          "You do not have permission to perform this action.",
        ),
      );
    }
    next();
  };
