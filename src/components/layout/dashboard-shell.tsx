"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  Menu,
  X,
  LogOut,
  LogIn,
  Shield,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { getAuthorizedNavigation } from "@/config/navigation";
import { StatusBadge } from "@/components/feedback/status-badge";
import { LogoutConfirmModal } from "@/components/feedback/logout-confirm-modal";

export function DashboardShell({
  children,
}: {
  role?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, role, logout } = useSession();

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

  // Navigation items filtered by the user's granular permissions
  const authorizedLinks = getAuthorizedNavigation(user);

  const getRoleIcon = () => {
    switch (role) {
      case "ADMIN":
        return <Shield size={16} className="text-emerald-600" />;
      case "MENTOR":
        return <Users size={16} className="text-purple-600" />;
      case "STUDENT":
      default:
        return <GraduationCap size={16} className="text-brand-600" />;
    }
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-950">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BookOpenCheck size={18} />
          </span>
          <span className="tracking-tight text-lg">ProjectPilot</span>
        </Link>
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 pt-5">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {role ? `${role} Workspace` : "Workspace Menu"}
          </p>
          {role && <StatusBadge status={role} className="text-[10px] py-0 px-2" />}
        </div>

        <nav className="space-y-1">
          {authorizedLinks.map(({ label, href, icon: Icon, badge }) => {
            const isDashboard = href === "/dashboard";
            const active = isDashboard
              ? pathname === "/dashboard" || pathname.endsWith("/dashboard")
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-brand-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={active ? "text-brand-600" : "text-slate-400"} />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="mt-auto border-t border-slate-100 p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <LogIn size={15} /> Sign In
          </Link>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* <DevMockBanner /> */}

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:fixed md:inset-y-0 md:top-[37px] md:flex md:w-64">
          {sidebar}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-64 shadow-xl">{sidebar}</div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <Menu size={19} />
              </button>
              <div className="flex items-center gap-2">
                {getRoleIcon()}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {role ? `${role.charAt(0) + role.slice(1).toLowerCase()} Portal` : "ProjectPilot"}
                  </p>
                  <p className="hidden text-xs text-slate-500 sm:block">
                    Learning Management System
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>
                    Signed in as <strong>{user.name}</strong>
                  </span>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Guest Mode • Sign in
                </Link>
              )}
            </div>
          </header>

          {/* Page Body */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      <LogoutConfirmModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
