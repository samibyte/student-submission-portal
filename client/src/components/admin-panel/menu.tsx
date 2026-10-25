"use client";

import { useQuery } from "@tanstack/react-query";
import { Ellipsis, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/auth";
import { getMenuList } from "@/lib/menu-list";
import { cn } from "@/lib/utils";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: user } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: User }>(
          "/auth/me",
        );
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const menuList = getMenuList(pathname, user?.role);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li
              className={cn("w-full", groupLabel ? "pt-5" : "")}
              key={groupLabel || `group-${index}`}
            >
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(({ href, label, icon: Icon, active, submenus }) =>
                !submenus || submenus.length === 0 ? (
                  <div className="w-full" key={href || label}>
                    <TooltipProvider delay={100}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-10 mb-1 font-medium",
                                active &&
                                  "bg-secondary text-secondary-foreground font-semibold",
                              )}
                              render={<Link href={href} />}
                              nativeButton={false}
                            />
                          }
                        >
                          <span className={cn(isOpen === false ? "" : "mr-4")}>
                            <Icon size={18} />
                          </span>
                          <p
                            className={cn(
                              "max-w-[200px] truncate",
                              isOpen === false
                                ? "-translate-x-96 opacity-0"
                                : "translate-x-0 opacity-100",
                            )}
                          >
                            {label}
                          </p>
                        </TooltipTrigger>
                        {isOpen === false && (
                          <TooltipContent side="right">{label}</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="w-full" key={label || href}>
                    <CollapseMenuButton
                      icon={Icon}
                      label={label}
                      active={active ?? false}
                      submenus={submenus}
                      isOpen={isOpen}
                    />
                  </div>
                ),
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end">
            <TooltipProvider delay={100}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-center h-10 mt-5 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    />
                  }
                >
                  <span className={cn(isOpen === false ? "" : "mr-4")}>
                    <LogOut size={18} />
                  </span>
                  <p
                    className={cn(
                      "whitespace-nowrap font-medium",
                      isOpen === false ? "opacity-0 hidden" : "opacity-100",
                    )}
                  >
                    Sign out
                  </p>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">Sign out</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
