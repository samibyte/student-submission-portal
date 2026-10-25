import { Suspense } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { MentorDashboard } from "../MentorDashboard";

export default function SubmissionsPage() {
  return (
    <ContentLayout title="Submissions">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-28 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <MentorDashboard />
      </Suspense>
    </ContentLayout>
  );
}
