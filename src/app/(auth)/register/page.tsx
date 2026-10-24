import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-slate-950"><span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white"><BookOpenCheck size={18} /></span>ProjectPilot</Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">Registration fields and role rules will be added once the backend signup schema is verified.</p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Registration is a placeholder. No account is created from this page yet.</div>
        <p className="mt-6 text-sm text-slate-600">Already registered? <Link className="font-semibold text-brand-700 hover:underline" href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
