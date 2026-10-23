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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          "bg-gray-100 text-gray-800": variant === "default",
          "bg-yellow-100 text-yellow-800": variant === "pending",
          "bg-green-100 text-green-800": variant === "approved",
          "bg-red-100 text-red-800": variant === "rejected",
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
