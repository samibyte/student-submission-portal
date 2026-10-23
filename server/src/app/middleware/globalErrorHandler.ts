import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "../../../generated/prisma/client.js";
import AppError from "../errorHelper/appError.js";

const formatZodIssues = (error: ZodError): string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "";
    return path ? `${path}: ${issue.message}` : issue.message;
  });

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("[Error]", err instanceof Error ? err.message : err);

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = "Internal Server Error";
  const errors: string[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errors.push(...err.errors);
  } else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "Validation failed";
    errors.push(...formatZodIssues(err));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      const target = (err.meta?.target as string[])?.join(", ") ?? "field";
      errorMessage = `A record with this ${target} already exists.`;
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage = "Record not found.";
    } else {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Database request error.";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "Invalid data provided to the database.";
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: errorMessage,
    errors,
  });
};
