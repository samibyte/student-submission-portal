import { Suspense } from "react";
import { MentorDashboard } from "./MentorDashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        }
      >
        <MentorDashboard />
      </Suspense>
    </main>
  );
}
