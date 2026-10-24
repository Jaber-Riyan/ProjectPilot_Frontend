import React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingText = "Saving...",
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin mr-1.5" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
