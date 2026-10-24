import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3" aria-label="Breadcrumb">
      <Link href="/dashboard" className="flex items-center text-slate-400 hover:text-slate-700 transition">
        <Home size={13} className="mr-1" />
        Dashboard
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight size={13} className="text-slate-300 shrink-0" />
            {isLast || !item.href ? (
              <span className="font-semibold text-slate-900 truncate max-w-xs">{item.label}</span>
            ) : (
              <Link href={item.href} className="text-slate-500 hover:text-slate-800 transition truncate max-w-xs">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
