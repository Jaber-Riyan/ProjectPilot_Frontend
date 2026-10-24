"use client";

import React from "react";
import { LogOut, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LogoutConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function LogoutConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: LogoutConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogCloseButton onClose={() => onOpenChange(false)} />
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
          <LogOut size={20} />
        </div>
        <div className="flex-1">
          <DialogHeader className="pb-1">
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription className="mt-1">
              Are you sure you want to sign out of your ProjectPilot workspace? You will need to sign in again to access your coursework.
            </DialogDescription>
          </DialogHeader>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Signing out...
            </>
          ) : (
            "Sign Out"
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
