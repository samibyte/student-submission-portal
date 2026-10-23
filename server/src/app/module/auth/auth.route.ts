import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authController } from "./auth.controller";

export const authRouter = Router()

authRouter.post(
  "/register",
  validateRequest(UserValidation.StudentRegisterZodSchema),
  authController.registerStudent,
);