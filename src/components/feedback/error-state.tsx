import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please verify your connection or try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-red-100 text-red-600">
        <AlertCircle size={22} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 bg-white">
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}
