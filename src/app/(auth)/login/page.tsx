"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, ArrowRight, GraduationCap, Users, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useSession } from "@/hooks/use-session";
import type { UserRole } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickSignIn = async (role: UserRole) => {
    setIsLoading(true);
    let targetEmail = "student@projectpilot.dev";
    if (role === "MENTOR") targetEmail = "mentor@projectpilot.dev";
    if (role === "ADMIN") targetEmail = "admin@projectpilot.dev";

    await login(targetEmail, role);
    setIsLoading(false);
    router.push("/dashboard");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    await login(email);
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 bg-slate-50">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BookOpenCheck size={18} />
          </span>
          <span className="text-xl">ProjectPilot</span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Sign In to Workspace</h1>
        <p className="mt-1 text-sm text-slate-600">
          Select a role below to simulate workflows in local development mode.
        </p>

        {/* Development Quick Role Buttons */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick 1-Click Dev Sign-In
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSignIn("STUDENT")}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
                <GraduationCap size={16} />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Sign in as Demo Student</p>
                <p className="text-[11px] text-slate-500">student@projectpilot.dev</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-brand-600" />
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSignIn("MENTOR")}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-purple-600 text-white">
                <Users size={16} />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Sign in as Demo Mentor</p>
                <p className="text-[11px] text-slate-500">mentor@projectpilot.dev</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-purple-600" />
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickSignIn("ADMIN")}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
                <Shield size={16} />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Sign in as Demo Admin</p>
                <p className="text-[11px] text-slate-500">admin@projectpilot.dev</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-emerald-600" />
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">or sign in with email</span>
          </div>
        </div>

        {/* Manual form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <FormField label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@projectpilot.dev"
              required
            />
          </FormField>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Sign in to Mock Session"}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
          <strong>Local Mock Authentication:</strong> No credentials are sent over the network or persisted as production secrets.
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <Link className="font-semibold text-brand-700 hover:underline" href="/dashboard">
            Continue to workspace without credentials →
          </Link>
        </p>
      </section>
    </main>
  );
}
