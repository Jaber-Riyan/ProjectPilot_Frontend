import { ArrowUpRight, BookOpen, ClipboardCheck, Clock3, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardPlaceholder({ role, title, description }: { role: string; title: string; description: string }) {
  const stats = [
    { label: "Learning activity", value: "—", icon: BookOpen, hint: "Connect API to load" },
    { label: "Tasks to review", value: "—", icon: ClipboardCheck, hint: "Connect API to load" },
    { label: "Next milestone", value: "—", icon: Clock3, hint: "Connect API to load" }
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2"><Badge variant="secondary">{role} preview</Badge><Badge variant="warning">API not connected</Badge></div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(({ label, value, icon: Icon, hint }) => <Card key={label}><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-brand-700"><Icon size={19} /></span></div><p className="mt-3 text-xs text-slate-500">{hint}</p></CardContent></Card>)}</div>
      <Card><CardContent className="p-6 sm:p-8"><div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><GraduationCap size={23} /></div><h2 className="mt-4 text-lg font-semibold text-slate-900">Your workspace is ready for integration</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">This template establishes the page layout and reusable components. Once the backend endpoint guide is verified, each section can be connected to real data with loading, empty, error, and success states.</p><div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Integration-ready foundation <ArrowUpRight size={16} /></div></CardContent></Card>
    </div>
  );
}
