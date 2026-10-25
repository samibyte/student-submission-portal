"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/auth";

export function UserNav() {
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

  const name = user?.name || "User";
  const email = user?.email || "";
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const dashboardHref = user?.role === "STUDENT" ? "/submit" : "/dashboard";

  return (
    <DropdownMenu>
      <TooltipProvider delay={100}>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="relative h-8 w-8 rounded-full border border-border"
                  />
                }
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom">Account</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{name}</p>
                {user?.role && (
                  <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="hover:cursor-pointer"
            render={
              <Link href={dashboardHref} className="flex items-center w-full" />
            }
          >
            <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:cursor-pointer"
            render={
              <Link href="/account" className="flex items-center w-full" />
            }
          >
            <UserIcon className="w-4 h-4 mr-3 text-muted-foreground" />
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3 text-destructive" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
