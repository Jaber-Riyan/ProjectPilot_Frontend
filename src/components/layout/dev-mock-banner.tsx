"use client";

import React from "react";
import { Database } from "lucide-react";
import { RoleSwitcher } from "@/components/access/role-switcher";

export function DevMockBanner() {
  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded bg-amber-200/80 text-amber-800">
          <Database size={12} />
        </span>
        <span className="font-semibold">Local Mock Mode:</span>
        <span className="hidden sm:inline text-amber-800">
          Workflows run on isolated local fixtures. Backend APIs are not connected in this phase.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <RoleSwitcher />
      </div>
    </div>
  );
}
