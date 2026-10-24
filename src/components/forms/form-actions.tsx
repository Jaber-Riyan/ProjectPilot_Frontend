import React from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "./submit-button";

interface FormActionsProps {
  submitLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
}

export function FormActions({
  submitLabel = "Save Changes",
  loadingLabel = "Saving...",
  isLoading = false,
  cancelLabel = "Cancel",
  onCancel,
  className = "",
}: FormActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-6 border-t border-slate-100 ${className}`}>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
      )}
      <SubmitButton isLoading={isLoading} loadingText={loadingLabel}>
        {submitLabel}
      </SubmitButton>
    </div>
  );
}
