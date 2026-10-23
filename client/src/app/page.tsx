import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";

// Root page: redirect based on role
export default async function Home() {
  const user = await getMe();
  if (!user) redirect("/login");
  if (user.role === "MENTOR") redirect("/dashboard");
  redirect("/submit");
}
