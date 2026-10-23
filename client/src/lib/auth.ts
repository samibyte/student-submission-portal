import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR";
  createdAt?: string;
}

export async function getMe(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data as User) || null;
  } catch {
    return null;
  }
}

export async function requireAuth(requiredRole?: "STUDENT" | "MENTOR") {
  const user = await getMe();
  if (!user) {
    redirect("/login");
  }
  if (requiredRole && user.role !== requiredRole) {
    redirect(user.role === "MENTOR" ? "/dashboard" : "/submit");
  }
  return user;
}
