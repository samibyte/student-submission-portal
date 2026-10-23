import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import { signupSchema, loginSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authRateLimiter,
  validateRequest(signupSchema),
  authController.signup,
);

authRouter.post(
  "/login",
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login,
);

authRouter.post("/logout", authController.logout);

authRouter.get("/me", authenticate, authController.me);
