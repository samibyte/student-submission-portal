import { requireAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export default async function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth("STUDENT");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
