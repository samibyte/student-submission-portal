import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { requireAuth } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
