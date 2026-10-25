import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "pending" | "approved" | "rejected";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-muted text-muted-foreground": variant === "default",
          "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30":
            variant === "pending",
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30":
            variant === "approved",
          "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/30":
            variant === "rejected",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(
  status: string,
): "pending" | "approved" | "rejected" {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}
