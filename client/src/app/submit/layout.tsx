import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { requireAuth } from "@/lib/auth";

export default async function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth("STUDENT");

  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
