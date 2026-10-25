"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Layers,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/auth";

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
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
  student: Student;
}

export function DashboardOverview() {
  const queryClient = useQueryClient();

  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    submission: Submission | null;
    status: "APPROVED" | "REJECTED";
    comment: string;
  }>({
    isOpen: false,
    submission: null,
    status: "APPROVED",
    comment: "",
  });

  // Current user query
  const { data: user } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: User }>(
          "/auth/me",
        );
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  // Stats query
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isFetching: isStatsFetching,
  } = useQuery<Stats>({
    queryKey: ["submissions", "stats"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Stats }>(
        "/submissions/stats",
      );
      return res.data;
    },
  });

  // Pending Submissions for quick action
  const {
    data: pendingSubmissions,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useQuery<Submission[]>({
    queryKey: ["submissions", "pending-overview"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Submission[] }>(
        "/submissions?status=PENDING&limit=5",
      );
      return res.data;
    },
  });

  // Recent Submissions
  const {
    data: recentSubmissions,
    isLoading: isRecentLoading,
    refetch: refetchRecent,
  } = useQuery<Submission[]>({
    queryKey: ["submissions", "recent-overview"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Submission[] }>(
        "/submissions?limit=5",
      );
      return res.data;
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      comment,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      comment?: string;
    }) => {
      return apiFetch<{ success: boolean; message: string; data: Submission }>(
        `/submissions/${id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, comment }),
        },
      );
    },
    onSuccess: (res) => {
      toast.success(res.message || "Review submitted successfully");
      setReviewDialog({
        isOpen: false,
        submission: null,
        status: "APPROVED",
        comment: "",
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (err: unknown) => {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(
        error?.data?.message || error?.message || "Failed to submit review",
      );
    },
  });

  const handleOpenReview = (
    submission: Submission,
    status: "APPROVED" | "REJECTED",
  ) => {
    setReviewDialog({
      isOpen: true,
      submission,
      status,
      comment: status === "APPROVED" ? "Great job! Project approved." : "",
    });
  };

  const handleConfirmReview = async () => {
    if (!reviewDialog.submission) return;

    if (reviewDialog.status === "REJECTED" && !reviewDialog.comment.trim()) {
      toast.error("A comment is required when rejecting a submission");
      return;
    }

    await reviewMutation.mutateAsync({
      id: reviewDialog.submission.id,
      status: reviewDialog.status,
      comment: reviewDialog.comment.trim() || undefined,
    });
  };

  const refetchAll = () => {
    refetchStats();
    refetchPending();
    refetchRecent();
  };

  const total = stats?.total ?? 0;
  const pending = stats?.pending ?? 0;
  const approved = stats?.approved ?? 0;
  const rejected = stats?.rejected ?? 0;
  const reviewed = approved + rejected;

  const approvalRate =
    reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;
  const reviewedRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of student project submissions, review queues, and portal
            analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isStatsFetching}
            className="text-xs"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                isStatsFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            className="text-xs"
            render={<Link href="/dashboard/submissions" />}
            nativeButton={false}
          >
            <FolderGit2 className="mr-1.5 h-3.5 w-3.5" />
            Manage Submissions
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isStatsLoading ? "..." : total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All student projects received
            </p>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isStatsLoading ? "..." : pending}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {pending > 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Requires your attention
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3 mr-1" />
                  Queue is clear
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approved Projects */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Projects
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isStatsLoading ? "..." : approved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvalRate}% approval rate of reviewed
            </p>
          </CardContent>
        </Card>

        {/* Rejected Projects */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Revision
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {isStatsLoading ? "..." : rejected}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rejected or requested changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Review Velocity & Status Distribution Bar */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Review Progress & Status Distribution
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Breakdown of student submissions status and review completion
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
              {reviewedRate}% Complete
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multi-segment progress bar */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            {total > 0 ? (
              <>
                <div
                  style={{ width: `${(approved / total) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Approved: ${approved}`}
                />
                <div
                  style={{ width: `${(rejected / total) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Rejected: ${rejected}`}
                />
                <div
                  style={{ width: `${(pending / total) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Pending: ${pending}`}
                />
              </>
            ) : (
              <div className="w-full bg-muted" />
            )}
          </div>

          {/* Legend items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Approved:</span>
              <span className="font-semibold text-foreground">{approved}</span>
              <span className="text-muted-foreground">
                ({total > 0 ? Math.round((approved / total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-semibold text-foreground">{pending}</span>
              <span className="text-muted-foreground">
                ({total > 0 ? Math.round((pending / total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Needs Revision:</span>
              <span className="font-semibold text-foreground">{rejected}</span>
              <span className="text-muted-foreground">
                ({total > 0 ? Math.round((rejected / total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Reviewed:</span>
              <span className="font-semibold text-foreground">{reviewed}</span>
              <span className="text-muted-foreground">({reviewedRate}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Urgent Pending Queue & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions Queue */}
        <Card className="border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Submissions Awaiting Review
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Priority items waiting for mentor evaluation
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              render={<Link href="/dashboard/submissions?status=PENDING" />}
              nativeButton={false}
            >
              View Queue ({pending})
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isPendingLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-14 w-full animate-pulse rounded bg-muted" />
                <div className="h-14 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : !pendingSubmissions || pendingSubmissions.length === 0 ? (
              <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No submissions currently waiting for your review.
                </p>
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-border">
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {sub.projectName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          by {sub.student.name} •{" "}
                          {new Date(sub.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="success"
                          size="xs"
                          className="h-6 text-xs px-2"
                          onClick={() => handleOpenReview(sub, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          className="h-6 text-xs px-2"
                          onClick={() => handleOpenReview(sub, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <a
                        href={sub.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-primary hover:underline font-medium"
                      >
                        Repo
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                      <a
                        href={sub.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-primary hover:underline font-medium"
                      >
                        Live Demo
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card className="border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-primary" />
                Latest Submissions
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Most recent student uploads across all statuses
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              render={<Link href="/dashboard/submissions" />}
              nativeButton={false}
            >
              See All <ArrowRight className="ml-1 w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isRecentLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-14 w-full animate-pulse rounded bg-muted" />
                <div className="h-14 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : !recentSubmissions || recentSubmissions.length === 0 ? (
              <div className="my-auto py-8 text-center text-xs text-muted-foreground">
                No submissions received yet.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-border">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {sub.projectName}
                        </span>
                        <Badge
                          variant={statusVariant(sub.status)}
                          className="shrink-0 text-[10px] px-1.5 py-0"
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {sub.student.name} ({sub.student.email})
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap text-right shrink-0">
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) setReviewDialog((prev) => ({ ...prev, isOpen: false }));
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.status === "APPROVED"
                ? "Approve Submission"
                : "Reject Submission"}
            </DialogTitle>
          </DialogHeader>

          {reviewDialog.submission && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/50 p-3 text-xs border border-border">
                <div className="font-semibold text-foreground">
                  {reviewDialog.submission.projectName}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  by {reviewDialog.submission.student.name} (
                  {reviewDialog.submission.student.email})
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="overview-review-comment">
                  Feedback Comment{" "}
                  {reviewDialog.status === "REJECTED" ? (
                    <span className="text-destructive">* (Required)</span>
                  ) : (
                    <span className="text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  )}
                </Label>
                <Textarea
                  id="overview-review-comment"
                  rows={4}
                  placeholder={
                    reviewDialog.status === "REJECTED"
                      ? "Explain why the project is being rejected and what changes are required..."
                      : "Add positive feedback or commendations..."
                  }
                  value={reviewDialog.comment}
                  onChange={(e) =>
                    setReviewDialog((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setReviewDialog((prev) => ({ ...prev, isOpen: false }))
                  }
                  disabled={reviewMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={
                    reviewDialog.status === "APPROVED"
                      ? "success"
                      : "destructive"
                  }
                  onClick={handleConfirmReview}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending
                    ? "Submitting..."
                    : reviewDialog.status === "APPROVED"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
