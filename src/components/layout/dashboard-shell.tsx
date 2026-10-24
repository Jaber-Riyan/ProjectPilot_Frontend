"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, ChevronDown, CircleHelp, LayoutDashboard, Menu, Settings2, Users, BookOpen, ClipboardCheck, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Role = "student" | "mentor" | "admin";
const navigation = {
  student: [{ label: "Overview", href: "/student/dashboard", icon: LayoutDashboard }, { label: "My courses", href: "/student/courses", icon: BookOpen }, { label: "Assignments", href: "/student/assignments", icon: ClipboardCheck }],
  mentor: [{ label: "Overview", href: "/mentor/dashboard", icon: LayoutDashboard }, { label: "Courses", href: "/mentor/courses", icon: BookOpen }, { label: "Submissions", href: "/mentor/submissions", icon: ClipboardCheck }, { label: "Learners", href: "/mentor/students", icon: Users }],
  admin: [{ label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard }, { label: "Courses", href: "/admin/courses", icon: BookOpen }, { label: "Users", href: "/admin/users", icon: Users }, { label: "Settings", href: "/admin/settings", icon: Settings2 }]
} satisfies Record<Role, { label: string; href: string; icon: typeof LayoutDashboard }[]>;

const roleLabels: Record<Role, string> = { student: "Student", mentor: "Mentor", admin: "Admin" };

export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = navigation[role];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-950"><span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white"><BookOpenCheck size={17} /></span>ProjectPilot</Link>
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
      </div>
      <div className="px-4 pt-5"><p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{roleLabels[role]} workspace</p>
        <nav className="mt-3 space-y-1">{links.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== `/${role}/dashboard` && pathname.startsWith(href));
          return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-blue-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon size={18} />{label}</Link>;
        })}</nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CircleHelp size={16} />Need help?</div><p className="mt-1 text-xs leading-5 text-slate-500">Help and support links can be added here.</p></div>
        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4"><div className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">{roleLabels[role][0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{roleLabels[role]} preview</p><p className="text-xs text-slate-500">Not signed in</p></div><ShieldCheck size={16} className="text-slate-400" /></div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:fixed md:inset-y-0 md:flex">{sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-40 md:hidden"><button aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/30" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-64">{sidebar}</div></div>}
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"><Menu size={19} /></button><div><p className="text-sm font-semibold text-slate-900">{roleLabels[role]} workspace</p><p className="hidden text-xs text-slate-500 sm:block">A clear view of what matters next</p></div></div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"><span className="size-2 rounded-full bg-amber-400" /> Preview mode <ChevronDown size={14} /></div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
