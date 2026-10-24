"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, GraduationCap, Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { LogoutConfirmModal } from "@/components/feedback/logout-confirm-modal";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useSession();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutModalOpen(false);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BookOpenCheck size={19} />
          </span>
          <span className="text-xl">ProjectPilot</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                Signed in as <strong className="text-slate-800">{user.name}</strong>
              </span>
              <Button asChild size="sm">
                <Link href="/dashboard" className="gap-1.5">
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoutModalOpen(true)}
                className="gap-1.5 text-slate-600 hover:text-red-600 hover:border-red-200"
              >
                <LogOut size={15} />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/login">
                Sign in
              </Link>
              <Button asChild>
                <Link href="/register">
                  Get started <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-24">
        <div>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Your learning workspace
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
            Learn, build, and move forward.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            A focused, role-based platform for students, mentors, and administrators to manage learning and coursework.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open workspace <ArrowRight size={17} />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Secure, role-governed workspace with verified authentication and permission scoping.
          </p>
        </div>

        {/* Feature Cards Showcase */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Your workspace</p>
              <p className="mt-1 text-xs text-slate-500">Role-governed environment</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Ready to learn
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Courses", value: "Learn", icon: BookOpenCheck },
              { label: "Mentorship", value: "Grow", icon: Users },
              { label: "Progress", value: "Track", icon: GraduationCap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-brand-700">
                  <Icon size={18} />
                </span>
                <p className="mt-5 text-lg font-semibold text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Learning journey</p>
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-2/3 rounded-full bg-brand-600" />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Manage enrollments, view published coursework, and submit assignments with ease.
            </p>
          </div>
        </div>
      </section>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </main>
  );
}
