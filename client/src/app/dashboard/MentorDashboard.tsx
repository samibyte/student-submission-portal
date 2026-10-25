"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

interface Feedback {
  id: string;
  comment: string;
  createdAt: string;
  mentor: { id: string; name: string };
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
  feedbacks: Feedback[];
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface SubmissionsResponse {
  data: Submission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "ALL" },
] as const;

export function MentorDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL query params
  const rawStatus = searchParams.get("status")?.toUpperCase() || "PENDING";
  const currentStatus = STATUS_FILTERS.some((f) => f.value === rawStatus)
    ? rawStatus
    : "PENDING";
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );

  // Review Dialog State
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

  // Helper to update search params
  const updateParams = (newStatus: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", newStatus);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // 1. Fetch Stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery<Stats>({
    queryKey: ["submissions", "stats"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Stats }>(
        "/submissions/stats",
      );
      return res.data;
    },
  });

  // 2. Fetch Submissions with pagination and status filter
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
    isFetching,
  } = useQuery<SubmissionsResponse>({
    queryKey: ["submissions", "list", currentStatus, currentPage],
    queryFn: async () => {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (currentStatus !== "ALL") {
        query.set("status", currentStatus);
      }
      const res = await apiFetch<{
        success: boolean;
        data: Submission[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(`/submissions?${query.toString()}`);

      return {
        data: res.data,
        page: res.page,
        limit: res.limit,
        total: res.total,
        totalPages: res.totalPages,
      };
    },
    placeholderData: keepPreviousData,
  });

  // 3. Review Mutation
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

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Submissions Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Review, filter, and provide feedback on student project
              submissions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchList();
            }}
            disabled={isFetching}
            className="text-xs self-start sm:self-auto"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total</span>
              <Layers className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {isStatsLoading ? "..." : (stats?.total ?? 0)}
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-amber-700 dark:text-amber-400">
              <span>Pending</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-300">
              {isStatsLoading ? "..." : (stats?.pending ?? 0)}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
              <span>Approved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-300">
              {isStatsLoading ? "..." : (stats?.approved ?? 0)}
            </div>
          </div>

          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-rose-700 dark:text-rose-400">
              <span>Rejected</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-300">
              {isStatsLoading ? "..." : (stats?.rejected ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = currentStatus === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => updateParams(f.value, 1)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground">
            {listData ? `Showing ${listData.total} submissions` : ""}
          </div>
        </div>

        {/* Submissions Table */}
        {isListLoading ? (
          <div className="space-y-3 py-8">
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : isListError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-6 text-center my-6">
            <p className="text-sm text-destructive">
              {(listError as Error)?.message || "Failed to load submissions"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchList()}
              className="mt-3 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : !listData?.data || listData.data.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No submissions found for status &quot;{currentStatus}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listData.data.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="align-top font-medium">
                      <div>
                        <div className="text-foreground font-semibold">
                          {sub.projectName}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs mt-0.5">
                          {sub.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-xs">
                        <div className="font-medium text-foreground">
                          {sub.student?.name}
                        </div>
                        <div className="text-muted-foreground">
                          {sub.student?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1 text-xs">
                        <a
                          href={sub.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-primary hover:underline font-medium"
                        >
                          Repository
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
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={statusVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      {sub.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => handleOpenReview(sub, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => handleOpenReview(sub, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Reviewed
                          {sub.reviewedAt
                            ? ` (${new Date(sub.reviewedAt).toLocaleDateString()})`
                            : ""}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {listData && listData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div className="text-xs text-muted-foreground">
              Page {listData.page} of {listData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams(currentStatus, currentPage - 1)}
                disabled={currentPage <= 1 || isFetching}
                className="h-8 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams(currentStatus, currentPage + 1)}
                disabled={currentPage >= listData.totalPages || isFetching}
                className="h-8 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
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
                <Label htmlFor="review-comment">
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
                  id="review-comment"
                  rows={4}
                  className="dark:text-secondary"
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
