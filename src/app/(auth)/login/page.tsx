"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpenCheck,
  ArrowRight,
  GraduationCap,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useSession } from "@/hooks/use-session";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import type { UserRole } from "@/types/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, login, quickLogin } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(false);

  const redirectTarget = searchParams.get("from") || "/dashboard";

  // Forcefully redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(redirectTarget);
    }
  }, [status, user, redirectTarget, router]);

  // Check if server-side dev quick login is enabled
  useEffect(() => {
    let isMounted = true;
    async function checkQuickLogin() {
      try {
        const res = await fetch("/api/dev/quick-login");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setQuickLoginEnabled(Boolean(data.enabled));
          }
        }
      } catch {
        // Fallback: disabled if route unreachable
        if (isMounted) setQuickLoginEnabled(false);
      }
    }
    checkQuickLogin();
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await login(values);
      router.push(redirectTarget);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setAuthError(null);
    setIsLoading(true);
    setActiveQuickRole(role);
    try {
      await quickLogin(role);
      router.push(redirectTarget);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Quick login as ${role} failed.`;
      setAuthError(message);
    } finally {
      setIsLoading(false);
      setActiveQuickRole(null);
    }
  };

  // If loading session or already authenticated, show redirecting state
  if (status === "loading" || (status === "authenticated" && user)) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-sm font-medium text-slate-600">Redirecting to workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 bg-slate-50">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        {/* Logo and Header */}
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BookOpenCheck size={18} />
          </span>
          <span className="text-xl">ProjectPilot</span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
          Sign In to Your Workspace
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your registered email and password to access your role portal.
        </p>

        {/* Global Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-in fade-in"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Sign in failed</p>
              <p className="mt-0.5 leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        {/* Development Quick Role Buttons */}
        {quickLoginEnabled && (
          <div className="mt-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Development Quick Login
              </p>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Dev Only
              </span>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("STUDENT")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
                  {isLoading && activeQuickRole === "STUDENT" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <GraduationCap size={16} />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Continue as Student</p>
                  <p className="text-[11px] text-slate-500">student@projectpilot.dev</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-blue-600" />
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("MENTOR")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-purple-600 text-white">
                  {isLoading && activeQuickRole === "MENTOR" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Users size={16} />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Continue as Mentor</p>
                  <p className="text-[11px] text-slate-500">mentor@projectpilot.dev</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-purple-600" />
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("ADMIN")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
                  {isLoading && activeQuickRole === "ADMIN" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Shield size={16} />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Continue as Admin</p>
                  <p className="text-[11px] text-slate-500">admin@projectpilot.dev</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-emerald-600" />
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">or sign in with password</span>
              </div>
            </div>
          </div>
        )}

        {/* Manual Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField label="Email Address" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="e.g. student@projectpilot.dev"
              disabled={isLoading}
              {...register("email")}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isLoading}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <Button type="submit" disabled={isLoading} className="w-full mt-2">
            {isLoading && !activeQuickRole ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-brand-700 hover:underline" href="/register">
            Create an account
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">
          <Link className="hover:text-slate-600 hover:underline" href="/">
            ← Back to Home
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-4 py-12 bg-slate-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-brand-600" />
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
