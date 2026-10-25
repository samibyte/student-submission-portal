"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FolderGit2,
  Laptop,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Shield,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/auth";

interface StudentSubmissionSummary {
  id: string;
  projectName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function AccountProfileView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: User }>("/auth/me");
      return res.data;
    },
  });

  // Fetch role stats if mentor
  const { data: mentorStats } = useQuery<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>({
    queryKey: ["submissions", "stats"],
    queryFn: async () => {
      const res = await apiFetch<{
        success: boolean;
        data: {
          pending: number;
          approved: number;
          rejected: number;
          total: number;
        };
      }>("/submissions/stats");
      return res.data;
    },
    enabled: user?.role === "MENTOR",
  });

  // Fetch student submissions count if student
  const { data: studentSubmissions } = useQuery<StudentSubmissionSummary[]>({
    queryKey: ["submissions", "mine"],
    queryFn: async () => {
      const res = await apiFetch<{
        success: boolean;
        data: StudentSubmissionSummary[];
      }>("/submissions/mine");
      return res.data;
    },
    enabled: user?.role === "STUDENT",
  });

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

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

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-44 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const studentApprovedCount =
    studentSubmissions?.filter((s) => s.status === "APPROVED").length ?? 0;
  const studentPendingCount =
    studentSubmissions?.filter((s) => s.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <Card className="border-border overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/15 to-accent/20" />
        <CardContent className="relative pt-0 pb-6 px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <Avatar className="size-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {user?.name || "User"}
                  </h1>
                  <Badge
                    variant={user?.role === "MENTOR" ? "approved" : "default"}
                    className="uppercase tracking-wider font-mono text-[10px]"
                  >
                    {user?.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> User ID:
              </span>
              <span className="font-mono text-foreground">{user?.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="hover:text-foreground transition-colors p-1 rounded-sm cursor-pointer"
                title="Copy ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {user?.createdAt && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme & Appearance Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            Theme & Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Choose your preferred interface theme for the whole application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Light Theme */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                mounted && theme === "light"
                  ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="size-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-foreground">
                  Light
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Clean & bright appearance
                </div>
              </div>
              {mounted && theme === "light" && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Check className="w-3.5 h-3.5" /> Active
                </div>
              )}
            </button>

            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                mounted && theme === "dark"
                  ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-foreground">
                  Dark
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Easy on the eyes in low light
                </div>
              </div>
              {mounted && theme === "dark" && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Check className="w-3.5 h-3.5" /> Active
                </div>
              )}
            </button>

            {/* System Theme */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                mounted && theme === "system"
                  ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-foreground">
                  System
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Sync with your operating system
                </div>
              </div>
              {mounted && theme === "system" && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Check className="w-3.5 h-3.5" /> Active
                </div>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info & Role Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-xs">
              Your registered portal credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="account-name"
                className="text-xs text-muted-foreground"
              >
                Full Name
              </Label>
              <Input
                id="account-name"
                value={user?.name || ""}
                readOnly
                className="bg-muted/30 cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="account-email"
                className="text-xs text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="account-email"
                value={user?.email || ""}
                readOnly
                className="bg-muted/30 cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Assigned Role
              </Label>
              <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {user?.role === "MENTOR"
                      ? "Mentor / Reviewer"
                      : "Student / Submitter"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {user?.role === "MENTOR"
                      ? "Can review, approve, reject, and leave feedback on submissions"
                      : "Can submit project links, descriptions, and view reviews"}
                  </div>
                </div>
                <Badge
                  variant={user?.role === "MENTOR" ? "approved" : "default"}
                >
                  {user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Activity & Shortcuts
            </CardTitle>
            <CardDescription className="text-xs">
              Quick portal actions and your submission summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === "MENTOR" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> Pending Queue
                    </div>
                    <div className="text-xl font-bold text-foreground mt-1">
                      {mentorStats?.pending ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                      Approved
                    </div>
                    <div className="text-xl font-bold text-foreground mt-1">
                      {mentorStats?.approved ?? 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full justify-start text-xs h-9"
                    variant="outline"
                    render={<Link href="/dashboard" />}
                    nativeButton={false}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2 text-primary" />
                    Go to Dashboard Overview
                  </Button>
                  <Button
                    className="w-full justify-start text-xs h-9"
                    variant="outline"
                    render={<Link href="/dashboard/submissions" />}
                    nativeButton={false}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 mr-2 text-primary" />
                    Review Submissions Table
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3 text-primary" /> My
                      Submissions
                    </div>
                    <div className="text-xl font-bold text-foreground mt-1">
                      {studentSubmissions?.length ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                      Approved
                    </div>
                    <div className="text-xl font-bold text-foreground mt-1">
                      {studentApprovedCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> Pending
                      Review
                    </div>
                    <div className="text-xl font-bold text-foreground mt-1">
                      {studentPendingCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full justify-start text-xs h-9"
                    variant="outline"
                    render={<Link href="/submit" />}
                    nativeButton={false}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 mr-2 text-primary" />
                    Submit New Project / View Status
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
