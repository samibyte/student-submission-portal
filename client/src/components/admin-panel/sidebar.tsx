"use client";

import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  const isOpen = sidebar?.isOpen ?? true;
  const toggleOpen = sidebar?.toggleOpen;
  const getOpenState = sidebar ? sidebar.getOpenState : () => true;
  const setIsHover = sidebar ? sidebar.setIsHover : () => {};
  const settings = sidebar?.settings ?? { disabled: false, isHoverOpen: false };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/60 shadow-xs dark:bg-sidebar/65 dark:border-white/[0.06]",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden",
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <section
        aria-label="Sidebar Navigation"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto"
      >
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mb-1 justify-start px-2 hover:no-underline",
            !getOpenState() ? "translate-x-1" : "translate-x-0",
          )}
          variant="link"
          render={
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 text-foreground"
            />
          }
          nativeButton={false}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div
            className={cn(
              "flex flex-col text-left transition-[transform,opacity,display] ease-in-out duration-300",
              !getOpenState()
                ? "-translate-x-96 opacity-0 hidden"
                : "translate-x-0 opacity-100",
            )}
          >
            <span className="font-bold text-base leading-tight tracking-tight text-foreground">
              Project Portal
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Student Submissions
            </span>
          </div>
        </Button>
        <Menu isOpen={getOpenState()} />
      </section>
    </aside>
  );
}
