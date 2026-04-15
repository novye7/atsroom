"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils";

interface DropdownWrapperProps {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
}

export function DropdownWrapper({
  trigger,
  children,
  align = "end",
  className,
}: DropdownWrapperProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} data-slot="dropdown-wrapper" className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-whisper)_0px_4px_24px]",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {typeof children === "function" ? (children as (close: () => void) => ReactNode)(close) : children}
        </div>
      )}
    </div>
  );
}
