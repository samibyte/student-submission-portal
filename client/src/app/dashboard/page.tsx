import { Suspense } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { DashboardOverview } from "./DashboardOverview";

export default function DashboardOverviewPage() {
  return (
    <ContentLayout title="Overview">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-28 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <DashboardOverview />
      </Suspense>
    </ContentLayout>
  );
}
