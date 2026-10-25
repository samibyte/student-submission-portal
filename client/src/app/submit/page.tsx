import { ContentLayout } from "@/components/admin-panel/content-layout";
import { StudentPortal } from "./StudentPortal";

export default function SubmitPage() {
  return (
    <ContentLayout title="Student Submissions">
      <div className="max-w-5xl mx-auto">
        <StudentPortal />
      </div>
    </ContentLayout>
  );
}
