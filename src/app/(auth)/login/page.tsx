import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-slate-950"><span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white"><BookOpenCheck size={18} /></span>ProjectPilot</Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">The sign-in form will be connected after we verify the backend authentication contract.</p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Authentication is not wired up yet. No credentials are submitted or stored on this page.</div>
        <p className="mt-6 text-sm text-slate-600">New to ProjectPilot? <Link className="font-semibold text-brand-700 hover:underline" href="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
