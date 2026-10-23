import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelper/appError.js";
import type {
  CreateSubmissionInput,
  ReviewSubmissionInput,
  ListSubmissionsQuery,
} from "./submissions.schema.js";

// ── normalize repo URL ─────────────────────────────────────────────────────────
const normalizeRepoUrl = (raw: string): string => {
  let url = raw.trim().toLowerCase();
  // Force https
  url = url.replace(/^http:\/\//, "https://");
  // Strip www.
  url = url.replace(/^https:\/\/www\./, "https://");
  // Strip trailing .git
  url = url.replace(/\.git$/, "");
  // Strip trailing slash
  url = url.replace(/\/$/, "");
  return url;
};

// ── create ─────────────────────────────────────────────────────────────────────
export const createSubmission = async (
  studentId: string,
  input: CreateSubmissionInput,
) => {
  const repoUrl = normalizeRepoUrl(input.repoUrl);

  // Let the DB unique constraint bubble up as P2002 → 409 via error handler
  const submission = await prisma.submission.create({
    data: {
      projectName: input.projectName,
      repoUrl,
      liveUrl: input.liveUrl,
      description: input.description,
      studentId,
    },
    include: {
      feedbacks: {
        include: { mentor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return submission;
};

// ── get mine ──────────────────────────────────────────────────────────────────
export const getMySubmissions = async (studentId: string) => {
  return prisma.submission.findMany({
    where: { studentId },
    include: {
      feedbacks: {
        include: { mentor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ── list (mentor) ──────────────────────────────────────────────────────────────
export const listSubmissions = async (query: ListSubmissionsQuery) => {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [data, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        feedbacks: {
          include: { mentor: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// ── review ─────────────────────────────────────────────────────────────────────
export const reviewSubmission = async (
  submissionId: string,
  mentorId: string,
  input: ReviewSubmissionInput,
) => {
  const existing = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Submission not found.");
  }

  if (existing.status !== "PENDING") {
    throw new AppError(
      httpStatus.CONFLICT,
      `Submission is already ${existing.status.toLowerCase()}. Only PENDING submissions can be reviewed.`,
    );
  }

  const [submission] = await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: input.status,
        reviewedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        feedbacks: {
          include: { mentor: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.feedback.create({
      data: {
        comment: input.comment ?? `Submission ${input.status.toLowerCase()}.`,
        submissionId,
        mentorId,
      },
    }),
  ]);

  return submission;
};

// ── stats (mentor) ─────────────────────────────────────────────────────────────
export const getStats = async () => {
  const grouped = await prisma.submission.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };

  for (const row of grouped) {
    const count = row._count.status;
    stats.total += count;
    if (row.status === "PENDING") stats.pending = count;
    else if (row.status === "APPROVED") stats.approved = count;
    else if (row.status === "REJECTED") stats.rejected = count;
  }

  return stats;
};
