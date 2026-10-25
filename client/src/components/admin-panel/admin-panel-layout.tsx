"use client";

import { Footer } from "@/components/admin-panel/footer";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  const isOpen = sidebar ? sidebar.getOpenState() : true;
  const disabled = sidebar?.settings.disabled ?? false;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-muted/20 transition-[margin-left] ease-in-out duration-300",
          !disabled && (!isOpen ? "lg:ml-[90px]" : "lg:ml-72"),
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] ease-in-out duration-300",
          !disabled && (!isOpen ? "lg:ml-[90px]" : "lg:ml-72"),
        )}
      >
        <Footer />
      </footer>
    </>
  );
}
