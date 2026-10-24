import React from "react";
import { SearchInput } from "./search-input";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  statusOptions?: FilterOption[];
  onStatusChange?: (val: string) => void;
  extraFilters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  statusOptions,
  onStatusChange,
  extraFilters,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {onSearchChange && (
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-64"
          />
        )}

        {statusOptions && onStatusChange && (
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === opt.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {extraFilters}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
