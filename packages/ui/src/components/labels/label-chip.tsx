"use client";

import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface LabelChipProps {
  name: string;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function LabelChip({ name, onRemove, className, size = "default" }: LabelChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium transition-colors",
        size === "sm" ? "px-1.5 py-0 text-[10px] leading-5" : "px-2 py-0.5 text-xs",
        onRemove && "cursor-default",
        className
      )}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-[var(--accent)]/20 p-0.5 transition-colors"
        >
          <X className={size === "sm" ? "size-2.5" : "size-3"} />
        </button>
      )}
    </span>
  );
}
