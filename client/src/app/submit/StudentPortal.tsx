"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge, statusVariant } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ExternalLink, RefreshCw } from "lucide-react";

const submissionSchema = z.object({
  projectName: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(80, "Project name cannot exceed 80 characters")
    .transform((val) => val.trim()),
  repoUrl: z
    .string()
    .regex(
      /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/,
      "Must be in format https://github.com/{owner}/{repo}",
    ),
  liveUrl: z
    .string()
    .url("Must be a valid URL")
    .regex(/^https?:\/\//, "URL must start with http:// or https://"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});

type SubmissionFormValues = z.input<typeof submissionSchema>;

interface Feedback {
  id: string;
  comment: string;
  createdAt: string;
  mentor: { id: string; name: string };
}

interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  feedbacks: Feedback[];
}

export function StudentPortal() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      projectName: "",
      repoUrl: "",
      liveUrl: "",
      description: "",
    },
  });

  const {
    data: submissions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Submission[]>({
    queryKey: ["submissions", "mine"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Submission[] }>(
        "/submissions/mine",
      );
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: SubmissionFormValues) => {
      return apiFetch<{ success: boolean; data: Submission; message: string }>(
        "/submissions",
        {
          method: "POST",
          body: JSON.stringify(values),
        },
      );
    },
    onSuccess: (res) => {
      toast.success(res.message || "Project submitted successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["submissions", "mine"] });
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        setError("repoUrl", {
          type: "manual",
          message:
            "This repository URL has already been submitted by another student or project.",
        });
        toast.error("Duplicate repository URL");
      } else if (err?.status === 429) {
        toast.error(
          err?.data?.message ||
            "Rate limit reached. You can only submit 5 projects per hour.",
        );
      } else if (err?.status === 400 && err?.data?.errors?.length) {
        toast.error(err.data.errors[0]);
      } else {
        toast.error(err?.data?.message || err?.message || "Failed to submit project");
      }
    },
  });

  const onSubmit = async (data: SubmissionFormValues) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-10">
      {/* Submit Form Card */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Submit New Project
          </h2>
          <p className="text-sm text-gray-500">
            Provide details about your project for mentor review
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="e.g. Student Portal Fullstack"
                disabled={isSubmitting || createMutation.isPending}
                {...register("projectName")}
              />
              {errors.projectName && (
                <p className="text-xs text-red-500">
                  {errors.projectName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repoUrl">GitHub Repository URL</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/username/repository"
                disabled={isSubmitting || createMutation.isPending}
                {...register("repoUrl")}
              />
              {errors.repoUrl && (
                <p className="text-xs text-red-500">{errors.repoUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="liveUrl">Live Demo URL</Label>
              <Input
                id="liveUrl"
                placeholder="https://my-demo-app.vercel.app"
                disabled={isSubmitting || createMutation.isPending}
                {...register("liveUrl")}
              />
              {errors.liveUrl && (
                <p className="text-xs text-red-500">{errors.liveUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe features, technologies used, and testing instructions (20 - 1000 characters)..."
                rows={4}
                disabled={isSubmitting || createMutation.isPending}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending
                ? "Submitting..."
                : "Submit Project"}
            </Button>
          </div>
        </form>
      </section>

      {/* Submissions List Card */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              My Submissions
            </h2>
            <p className="text-sm text-gray-500">
              Track your submitted projects and mentor feedback
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-6">
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        ) : isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">
              {(error as any)?.message || "Failed to load submissions"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 text-xs"
            >
              Try again
            </Button>
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-500">
              You haven&apos;t submitted any projects yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Mentor Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="align-top font-medium">
                      <div>
                        <div className="text-gray-900">{sub.projectName}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 max-w-xs mt-0.5">
                          {sub.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1 text-xs">
                        <a
                          href={sub.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          Repository
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                        <a
                          href={sub.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          Live Demo
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={statusVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-xs text-gray-500 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="align-top">
                      {sub.feedbacks && sub.feedbacks.length > 0 ? (
                        <div className="space-y-1.5 max-w-sm">
                          {sub.feedbacks.map((fb) => (
                            <div
                              key={fb.id}
                              className="rounded bg-gray-50 p-2 text-xs border border-gray-100"
                            >
                              <p className="text-gray-800">{fb.comment}</p>
                              <div className="mt-1 text-[10px] text-gray-400">
                                {fb.mentor.name} •{" "}
                                {new Date(fb.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No feedback yet
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
