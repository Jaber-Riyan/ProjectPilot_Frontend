"use client";

import { useState } from "react";
import { UserCheck, Shield, GraduationCap, Users, RefreshCw, LogOut, ChevronDown } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogCloseButton } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/auth";

export function RoleSwitcher() {
  const { role, switchRole, resetMockData } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRoleSelect = (targetRole: UserRole | null) => {
    switchRole(targetRole);
    setIsOpen(false);
  };

  const handleResetData = () => {
    resetMockData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 hover:border-amber-300"
        title="Development Role Switcher"
      >
        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="font-medium">Dev Role:</span>
        <span className="font-bold">{role ?? "Guest (Signed Out)"}</span>
        <ChevronDown size={14} className="text-amber-700" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogCloseButton onClose={() => setIsOpen(false)} />
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-800">
              <UserCheck size={18} />
            </span>
            <div>
              <DialogTitle>Development Role Switcher</DialogTitle>
              <DialogDescription>
                Simulate role-based access control and CRUD workflows locally.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <strong>Development Fixture Simulation:</strong> This switcher changes the frontend mock session. No real tokens or backend authentication are involved in this phase.
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Simulated Identity
            </p>

            {/* Student */}
            <button
              onClick={() => handleRoleSelect("STUDENT")}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                role === "STUDENT"
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-brand-700">
                  <GraduationCap size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Demo Student</p>
                    <Badge variant="secondary">STUDENT</Badge>
                  </div>
                  <p className="text-xs text-slate-500">user-student-001 • student@projectpilot.dev</p>
                  <p className="mt-1 text-[11px] text-slate-400">Can browse published courses, submit assignments, view own history.</p>
                </div>
              </div>
            </button>

            {/* Mentor */}
            <button
              onClick={() => handleRoleSelect("MENTOR")}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                role === "MENTOR"
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-purple-100 text-purple-700">
                  <Users size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Demo Mentor</p>
                    <Badge variant="secondary">MENTOR</Badge>
                  </div>
                  <p className="text-xs text-slate-500">user-mentor-001 • mentor@projectpilot.dev</p>
                  <p className="mt-1 text-[11px] text-slate-400">Can create courses, edit assigned courses, review assigned submissions.</p>
                </div>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => handleRoleSelect("ADMIN")}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                role === "ADMIN"
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Shield size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Demo Admin</p>
                    <Badge variant="secondary">ADMIN</Badge>
                  </div>
                  <p className="text-xs text-slate-500">user-admin-001 • admin@projectpilot.dev</p>
                  <p className="mt-1 text-[11px] text-slate-400">Global access: manage courses, review all submissions, manage users.</p>
                </div>
              </div>
            </button>

            {/* Guest */}
            <button
              onClick={() => handleRoleSelect(null)}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                !role
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <LogOut size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Sign Out (Guest Mode)</p>
                  <p className="text-xs text-slate-500">Simulate unauthenticated visitor browsing public pages.</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetData}
            className="text-xs text-slate-500 hover:text-slate-900 gap-1.5"
          >
            <RefreshCw size={14} className={resetSuccess ? "animate-spin text-emerald-600" : ""} />
            {resetSuccess ? "Mock Data Reset!" : "Reset Mock Data to Initial State"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
