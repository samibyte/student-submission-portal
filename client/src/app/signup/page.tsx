import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const user = await getMe();
  if (user) {
    redirect(user.role === "MENTOR" ? "/dashboard" : "/submit");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create an account
          </h1>
          <p className="text-sm text-gray-500">
            Enter your details below to register as a student
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
