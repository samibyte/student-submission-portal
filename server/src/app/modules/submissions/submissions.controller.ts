import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../util/catchAsync.js";
import { sendResponse } from "../../util/sendResponse.js";
import { listSubmissionsSchema, reviewSubmissionSchema } from "./submissions.schema.js";
import * as submissionsService from "./submissions.service.js";
import AppError from "../../errorHelper/appError.js";

// POST /submissions
export const createSubmission = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.sub;
    const submission = await submissionsService.createSubmission(
      studentId,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Submission created successfully.",
      data: submission,
    });
  },
);

// GET /submissions/mine
export const getMySubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.sub;
    const submissions = await submissionsService.getMySubmissions(studentId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submissions fetched successfully.",
      data: submissions,
    });
  },
);

// GET /submissions
export const listSubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const parsed = listSubmissionsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid query parameters.");
    }

    const result = await submissionsService.listSubmissions(parsed.data);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submissions fetched successfully.",
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

// PATCH /submissions/:id/review
export const reviewSubmission = catchAsync(
  async (req: Request, res: Response) => {
    const parsed = reviewSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? "Validation failed.",
      );
    }

    const mentorId = req.user!.sub;
    const submission = await submissionsService.reviewSubmission(
      String(req.params["id"]),
      mentorId,
      parsed.data,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Submission ${parsed.data.status.toLowerCase()} successfully.`,
      data: submission,
    });
  },
);

// GET /submissions/stats
export const getStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await submissionsService.getStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stats fetched successfully.",
    data: stats,
  });
});
