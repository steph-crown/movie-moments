// components/room/position-staleness-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, MapPin } from "lucide-react";
import { useUserPosition } from "@/contexts/user-position-context";

interface PositionStalenessModalProps {
  open: boolean;
  onUpdatePosition: () => void;
  onDismiss: () => void;
  currentPosition: string;
  timeElapsed: number; // in minutes
}

export function PositionStalenessModal({
  open,
  onUpdatePosition,
  onDismiss,
  currentPosition,
  timeElapsed,
}: PositionStalenessModalProps) {
  const [countdown, setCountdown] = useState(30); // 30 second auto-dismiss
  const { refreshPosition } = useUserPosition();

  // Countdown timer for auto-dismiss
  useEffect(() => {
    if (!open) return;

    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onDismiss]);

  const handleStillHere = async () => {
    // Refresh position to update the last activity time
    await refreshPosition();
    onDismiss();
  };

  const handleUpdatePosition = () => {
    onUpdatePosition();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Still watching?
          </DialogTitle>
          <DialogDescription>
            You&apos;ve been at the same position for {timeElapsed} minutes. Are
            you still watching?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Current position:</span>
            <span className="text-sm text-muted-foreground">
              {currentPosition}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleStillHere}
              className="flex-1"
            >
              Still here ({countdown}s)
            </Button>
            <Button onClick={handleUpdatePosition} className="flex-1">
              Update position
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This helps keep track of spoilers and sync with other viewers
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
