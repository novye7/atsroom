"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface PopoverProps {
  children: ReactNode;
}

export function Popover({ children }: PopoverProps) {
  return <>{children}</>;
}

interface PopoverTriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PopoverTrigger({ children, ...props }: PopoverTriggerProps) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}

interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PopoverContent({
  children,
  className,
  ...props
}: PopoverContentProps) {
  return (
    <div
      className={cn(
        "z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-whisper)_0px_4px_24px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
