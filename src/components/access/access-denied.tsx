"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredPermission?: string;
}

export function AccessDenied({
  title = "Access Restricted",
  description,
  requiredPermission,
}: AccessDeniedProps) {
  const router = useRouter();
  const { user, role, switchRole } = useSession();

  const defaultDescription = user
    ? `Your current role (${role}) does not have permission to access this resource or perform this action.`
    : "You must be signed in to access this page.";

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert size={28} />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description || defaultDescription}
        </p>

        {requiredPermission && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono">
            Required: <span className="font-semibold text-slate-900">{requiredPermission}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft size={16} /> Go Back
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              <Home size={16} /> Dashboard
            </Link>
          </Button>
        </div>

        {/* Development Quick Role Switcher */}
        <div className="mt-8 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dev Quick Switch (Test as)
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              size="sm"
              variant={role === "STUDENT" ? "default" : "outline"}
              onClick={() => switchRole("STUDENT")}
            >
              Student
            </Button>
            <Button
              size="sm"
              variant={role === "MENTOR" ? "default" : "outline"}
              onClick={() => switchRole("MENTOR")}
            >
              Mentor
            </Button>
            <Button
              size="sm"
              variant={role === "ADMIN" ? "default" : "outline"}
              onClick={() => switchRole("ADMIN")}
            >
              Admin
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Local development role simulation. Does not affect backend security.
          </p>
        </div>
      </div>
    </div>
  );
}
