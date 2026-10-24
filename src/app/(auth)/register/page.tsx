"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpenCheck,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useSession } from "@/hooks/use-session";
import { signupSchema, type SignupFormValues } from "@/features/auth/schemas/auth.schema";

export default function RegisterPage() {
  const router = useRouter();
  const { user, status, signup } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forcefully redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your details and try again.";
      setAuthError(message);
    } finally {
      setIsLoading(false);
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
          Create Your Account
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Get started with learning paths, interactive modules, and guided assignments.
        </p>

        {/* Global Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-in fade-in"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Registration failed</p>
              <p className="mt-0.5 leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        {/* Role Notice */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900">
          <GraduationCap size={16} className="shrink-0 text-blue-600" />
          <span>
            New accounts are provisioned with <strong>Student</strong> access. Mentor and Admin roles are granted by system administrators.
          </span>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <FormField label="Full Name" error={errors.name?.message} required>
            <Input
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex Johnson"
              disabled={isLoading}
              {...register("name")}
            />
          </FormField>

          <FormField label="Email Address" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="e.g. alex@example.com"
              disabled={isLoading}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Password"
            description="At least 8 characters with uppercase, lowercase, and a number"
            error={errors.password?.message}
            required
          >
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
                className="pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <Button type="submit" disabled={isLoading} className="w-full mt-2">
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-brand-700 hover:underline" href="/login">
            Sign in
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
