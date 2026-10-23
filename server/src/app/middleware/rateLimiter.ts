import rateLimit from "express-rate-limit";
import httpStatus from "http-status";
import type { Request } from "express";

const makeMessage = (msg: string) => ({
  success: false,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: msg,
  errors: [],
});

// Auth routes: 10 requests per 15 min per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: makeMessage(
    "Too many auth attempts. Please try again in 15 minutes.",
  ),
});

// Submission creation: 5 per hour, keyed by user id
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // req.user is set by the authenticate middleware
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user?.sub ?? req.ip ?? "unknown";
  },
  message: makeMessage(
    "You can only submit 5 projects per hour. Please try again later.",
  ),
});
