export const API_BASE = "/api";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    // Attach status so callers can branch on it
    const err = new Error(json?.message ?? "Request failed") as Error & {
      status: number;
      data: typeof json;
    };
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json as T;
}
