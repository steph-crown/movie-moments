// components/ui/time-input.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/string.utils";

interface TimeInputProps {
  value?: number | null; // seconds
  onChange?: (seconds: number) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeInput({
  value = null,
  onChange,
  className,
  disabled = false,
}: TimeInputProps) {
  // Convert seconds to HH:MM:SS
  const secondsToTime = (totalSeconds: number | null) => {
    if (!totalSeconds) return { hours: "", minutes: "", seconds: "" };

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString(),
      minutes: minutes.toString(),
      seconds: seconds.toString(),
    };
  };

  // Convert HH:MM:SS to seconds
  const timeToSeconds = (hours: string, minutes: string, seconds: string) => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 3600 + m * 60 + s;
  };

  const initialTime = secondsToTime(value);
  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [seconds, setSeconds] = useState(initialTime.seconds);

  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    const newTime = secondsToTime(value);
    setHours(newTime.hours);
    setMinutes(newTime.minutes);
    setSeconds(newTime.seconds);
  }, [value]);

  // Handle input change - WITH AUTO ADVANCE
  const handleInputChange = (
    newValue: string,
    field: "hours" | "minutes" | "seconds",
    maxValue: number,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    // Only allow digits
    const numericValue = newValue.replace(/\D/g, "");

    // Limit to 2 digits
    const limitedValue = numericValue.slice(0, 2);

    // Validate max value
    if (limitedValue.length > 0) {
      const numValue = Math.min(parseInt(limitedValue), maxValue);
      const finalValue = numValue.toString();

      // Update state
      if (field === "hours") {
        setHours(finalValue);
      } else if (field === "minutes") {
        setMinutes(finalValue);
      } else {
        setSeconds(finalValue);
      }

      // Auto-advance when 2 actual digits are typed
      if (limitedValue.length === 2 && nextRef?.current) {
        setTimeout(() => {
          nextRef.current?.focus();
          nextRef.current?.select();
        }, 10);
      }

      // Calculate and call onChange
      const currentHours = field === "hours" ? finalValue : hours;
      const currentMinutes = field === "minutes" ? finalValue : minutes;
      const currentSeconds = field === "seconds" ? finalValue : seconds;

      const totalSeconds = timeToSeconds(
        currentHours,
        currentMinutes,
        currentSeconds
      );
      onChange?.(totalSeconds);
    } else {
      // Handle empty input - DON'T clear other fields
      if (field === "hours") {
        setHours("");
      } else if (field === "minutes") {
        setMinutes("");
      } else {
        setSeconds("");
      }

      // Calculate total with empty field as 0, but keep other fields
      const currentHours = field === "hours" ? "0" : hours;
      const currentMinutes = field === "minutes" ? "0" : minutes;
      const currentSeconds = field === "seconds" ? "0" : seconds;

      const totalSeconds = timeToSeconds(
        currentHours,
        currentMinutes,
        currentSeconds
      );
      onChange?.(totalSeconds);
    }
  };

  // Handle key navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "hours" | "minutes" | "seconds"
  ) => {
    if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      if (field === "hours") minutesRef.current?.focus();
      else if (field === "minutes") secondsRef.current?.focus();
    } else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      if (field === "seconds") minutesRef.current?.focus();
      else if (field === "minutes") hoursRef.current?.focus();
    }
  };

  return (
    <div className={cn("flex items-center gap-1 w-fit", className)}>
      {/* Hours */}
      <Input
        ref={hoursRef}
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={(e) =>
          handleInputChange(e.target.value, "hours", 23, minutesRef)
        }
        onKeyDown={(e) => handleKeyDown(e, "hours")}
        onFocus={(e) => e.target.select()}
        onBlur={() => setHours((prev) => prev.padStart(2, "0"))}
        className="w-12 text-center font-mono"
        placeholder="00"
        disabled={disabled}
      />

      <span className="text-muted-foreground font-mono">:</span>

      {/* Minutes */}
      <Input
        ref={minutesRef}
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={(e) =>
          handleInputChange(e.target.value, "minutes", 59, secondsRef)
        }
        onKeyDown={(e) => handleKeyDown(e, "minutes")}
        onFocus={(e) => e.target.select()}
        onBlur={() => setMinutes((prev) => prev.padStart(2, "0"))}
        className="w-12 text-center font-mono"
        placeholder="00"
        disabled={disabled}
      />

      <span className="text-muted-foreground font-mono">:</span>

      {/* Seconds */}
      <Input
        ref={secondsRef}
        type="text"
        inputMode="numeric"
        value={seconds}
        onChange={(e) => handleInputChange(e.target.value, "seconds", 59)}
        onKeyDown={(e) => handleKeyDown(e, "seconds")}
        onFocus={(e) => e.target.select()}
        onBlur={() => setSeconds((prev) => prev.padStart(2, "0"))}
        className="w-12 text-center font-mono"
        placeholder="00"
        disabled={disabled}
      />
    </div>
  );
}
