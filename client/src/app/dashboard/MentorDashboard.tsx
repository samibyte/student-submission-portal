"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from "lucide-react";

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
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

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
      const queryObj = new URLSearchParams();
      if (currentStatus !== "ALL") {
        queryObj.set("status", currentStatus);
      }
      queryObj.set("page", currentPage.toString());
      queryObj.set("limit", "10");

      const res = await apiFetch<{
        success: boolean;
        data: Submission[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(`/submissions?${queryObj.toString()}`);

      return {
        data: res.data,
        ...res.meta,
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
      toast.success(res.message || "Submission reviewed successfully");
      setReviewDialog((prev) => ({ ...prev, isOpen: false, comment: "" }));
      // Invalidate both list and stats
      queryClient.invalidateQueries({ queryKey: ["submissions", "list"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", "stats"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.data?.message || err?.message || "Failed to submit review",
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
    <div className="space-y-8">
      {/* Header & Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Mentor Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Review and manage incoming student submissions
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
            className="text-xs"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total</span>
              <Layers className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {isStatsLoading ? "..." : stats?.total ?? 0}
            </div>
          </div>

          <div className="rounded-lg border border-yellow-100 bg-yellow-50/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-yellow-700">
              <span>Pending</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-yellow-900">
              {isStatsLoading ? "..." : stats?.pending ?? 0}
            </div>
          </div>

          <div className="rounded-lg border border-green-100 bg-green-50/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-green-700">
              <span>Approved</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-green-900">
              {isStatsLoading ? "..." : stats?.approved ?? 0}
            </div>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-red-700">
              <span>Rejected</span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-red-900">
              {isStatsLoading ? "..." : stats?.rejected ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = currentStatus === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => updateParams(f.value, 1)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-gray-500">
            {listData ? `Showing ${listData.total} submissions` : ""}
          </div>
        </div>

        {/* Submissions Table */}
        {isListLoading ? (
          <div className="space-y-3 py-8">
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        ) : isListError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center my-6">
            <p className="text-sm text-red-600">
              {(listError as any)?.message || "Failed to load submissions"}
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
          <div className="py-12 text-center text-sm text-gray-500">
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
                        <div className="text-gray-900">{sub.projectName}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 max-w-xs mt-0.5">
                          {sub.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">
                          {sub.student?.name}
                        </div>
                        <div className="text-gray-400">
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
                        <span className="text-xs text-gray-400">
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
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
            <div className="text-xs text-gray-500">
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
              <div className="rounded-md bg-gray-50 p-3 text-xs border border-gray-100">
                <div className="font-semibold text-gray-900">
                  {reviewDialog.submission.projectName}
                </div>
                <div className="text-gray-500 mt-0.5">
                  by {reviewDialog.submission.student.name} (
                  {reviewDialog.submission.student.email})
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-comment">
                  Feedback Comment{" "}
                  {reviewDialog.status === "REJECTED" ? (
                    <span className="text-red-500">* (Required)</span>
                  ) : (
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  )}
                </Label>
                <Textarea
                  id="review-comment"
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
