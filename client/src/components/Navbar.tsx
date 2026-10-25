"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/auth";

interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Project Portal
          </span>
          <Badge
            variant={user.role === "MENTOR" ? "approved" : "default"}
            className="uppercase tracking-wider font-mono text-[10px]"
          >
            {user.role}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 hidden sm:block">
            <span className="font-medium text-gray-900">{user.name}</span>
            <span className="ml-1 text-gray-400">({user.email})</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
