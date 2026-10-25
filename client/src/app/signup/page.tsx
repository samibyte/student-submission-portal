import { GraduationCap } from "lucide-react";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { getMe } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const user = await getMe();
  if (user) {
    redirect(user.role === "MENTOR" ? "/dashboard" : "/submit");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-1 shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to register as a student
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
