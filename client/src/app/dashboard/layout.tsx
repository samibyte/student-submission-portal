import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth("MENTOR");

  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
