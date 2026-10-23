import { z } from "zod";

// helpers 
const githubRepoUrl = z
  .string()
  .regex(
    /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/,
    "repoUrl must be a valid https://github.com/{owner}/{repo} URL",
  );

const httpUrl = z
  .string()
  .url("liveUrl must be a valid http(s) URL")
  .regex(/^https?:\/\//, "liveUrl must start with http:// or https://");

//  create submission 
export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .min(3, "projectName must be at least 3 characters")
    .max(80, "projectName must be at most 80 characters")
    .transform((v) => v.trim()),
  repoUrl: githubRepoUrl,
  liveUrl: httpUrl,
  description: z
    .string()
    .min(20, "description must be at least 20 characters")
    .max(1000, "description must be at most 1000 characters"),
});

//  review submission
export const reviewSubmissionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    comment: z.string().min(1, "comment is required").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "A comment is required when rejecting a submission.",
      });
    }
  });

// list query 
export const listSubmissionsSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsSchema>;
