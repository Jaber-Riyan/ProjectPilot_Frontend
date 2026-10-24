import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white"><BookOpenCheck size={19} /></span>
          <span className="text-xl">ProjectPilot</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/login">Sign in</Link>
          <Button asChild><Link href="/register">Get started <ArrowRight size={16} /></Link></Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-24">
        <div>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-700">Your learning workspace</span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">Learn, build, and move forward.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">A focused place for students, mentors, and administrators to manage learning and coursework.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/login">Open workspace <ArrowRight size={17} /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/student/dashboard">Preview dashboard</Link></Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">Starter UI preview — authentication and live data integration come in the next phase.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div><p className="text-sm font-semibold text-slate-900">Your workspace</p><p className="mt-1 text-xs text-slate-500">A preview of the experience</p></div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ready to learn</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[{ label: "Courses", value: "Learn", icon: BookOpenCheck }, { label: "Mentorship", value: "Grow", icon: Users }, { label: "Progress", value: "Track", icon: GraduationCap }].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-brand-700"><Icon size={18} /></span>
                <p className="mt-5 text-lg font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Learning journey</p><span className="text-xs text-slate-500">Preview</span></div>
            <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 w-2/3 rounded-full bg-brand-600" /></div>
            <p className="mt-2 text-xs text-slate-500">Your course progress will appear here once APIs are connected.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
