"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Student", email: "student@example.com", password: "Student@123" },
  { role: "Mentor", email: "mentor@example.com", password: "Mentor@123" },
] satisfies Array<LoginValues & { role: string }>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoLoginSubmitting, setIsDemoLoginSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const login = async (values: LoginValues) => {
    setServerError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: {
          id: string;
          name: string;
          email: string;
          role: "STUDENT" | "MENTOR";
        };
        message: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      toast.success(res.message || "Logged in successfully");
      const target = res.data.role === "MENTOR" ? "/dashboard" : "/submit";
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      const msg =
        error?.data?.message || error?.message || "Invalid credentials";
      setServerError(msg);
      toast.error(msg);
    }
  };

  const onSubmit = (values: LoginValues) => login(values);

  const onDemoLogin = async (account: (typeof demoAccounts)[number]) => {
    setIsDemoLoginSubmitting(true);
    try {
      await login({ email: account.email, password: account.password });
    } finally {
      setIsDemoLoginSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isDemoLoginSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="dark:text-secondary"
          placeholder="name@example.com"
          autoComplete="email"
          disabled={isBusy}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            className="pr-10 dark:text-secondary"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isBusy}
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={isBusy}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="text-secondary" aria-hidden="true" size={18} />
            ) : (
              <Eye className="text-secondary" aria-hidden="true" size={18} />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isBusy}>
        {isBusy ? "Signing in..." : "Sign in"}
      </Button>

      <div className="space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Or continue with a demo account
        </p>
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <Button
              key={account.role}
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onDemoLogin(account)}
            >
              Demo {account.role}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
