import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { submissionRateLimiter } from "../../middleware/rateLimiter.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createSubmissionSchema } from "./submissions.schema.js";
import * as submissionsController from "./submissions.controller.js";

export const submissionsRouter = Router();

// All routes require authentication
submissionsRouter.use(authenticate);

// STUDENT routes
submissionsRouter.post(
  "/",
  authorize("STUDENT"),
  submissionRateLimiter,
  validateRequest(createSubmissionSchema),
  submissionsController.createSubmission,
);

submissionsRouter.get(
  "/mine",
  authorize("STUDENT"),
  submissionsController.getMySubmissions,
);

// MENTOR routes
submissionsRouter.get(
  "/stats",
  authorize("MENTOR"),
  submissionsController.getStats,
);

submissionsRouter.get(
  "/",
  authorize("MENTOR"),
  submissionsController.listSubmissions,
);

submissionsRouter.patch(
  "/:id/review",
  authorize("MENTOR"),
  submissionsController.reviewSubmission,
);
