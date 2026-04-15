"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

// ─── DropdownMenu Root ───

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <>{children}</>;
}

// ─── Trigger ───

interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DropdownMenuTrigger({ children, ...props }: DropdownMenuTriggerProps) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}

// ─── Content ───

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <div
      className={cn(
        "z-50 min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-whisper)_0px_4px_24px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Item ───

interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  destructive?: boolean;
  onSelect?: () => void;
}

export function DropdownMenuItem({
  children,
  destructive,
  onSelect,
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-colors",
        destructive
          ? "text-[var(--error)] hover:bg-[var(--error)]/10"
          : "text-[var(--text-primary)] hover:bg-[var(--muted-bg)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Separator ───

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px my-1 bg-[var(--border)]", className)}
    />
  );
}
