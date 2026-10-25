import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
        <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-sm text-slate-600">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
