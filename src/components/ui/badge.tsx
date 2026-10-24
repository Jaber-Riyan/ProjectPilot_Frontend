import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-transparent bg-brand-600 text-white",
  secondary: "border-transparent bg-slate-100 text-slate-700",
  success: "border-transparent bg-emerald-50 text-emerald-700",
  warning: "border-transparent bg-amber-50 text-amber-800",
  destructive: "border-transparent bg-red-50 text-red-700",
  outline: "border-slate-200 bg-white text-slate-700"
} as const;

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", variants[variant], className)} {...props} />;
}
