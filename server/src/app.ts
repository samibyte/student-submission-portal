import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import { envVars } from "./app/config/env.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";

const app: Application = express();

// Security headers
app.use(helmet());

// CORS with credentials (cookie forwarding)
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Student Submission Portal API is running",
  });
});

// ── Routes (added in steps 2 & 3) ─────────────────────────────────────────────

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(globalErrorHandler);
app.use(notFound);

export default app;
