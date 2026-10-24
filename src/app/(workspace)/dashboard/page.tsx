"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "ADMIN":
        router.replace("/admin/dashboard");
        break;
      case "MENTOR":
        router.replace("/mentor/dashboard");
        break;
      case "STUDENT":
      default:
        router.replace("/student/dashboard");
        break;
    }
  }, [user, status, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
