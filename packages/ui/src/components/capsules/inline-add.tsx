"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { validateEmail } from "../../lib/utils";

interface InlineAddProps {
  onSubmit: (email: string) => Promise<void>;
  placeholder?: string;
}

export function InlineAdd({ onSubmit, placeholder = "添加邮箱" }: InlineAddProps) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput) {
      inputRef.current?.focus();
    }
  }, [showInput]);

  async function handleSubmit() {
    const email = value.trim();
    if (!email) {
      setShowInput(false);
      return;
    }

    const error = validateEmail(email);
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(email);
      setValue("");
      setShowInput(false);
    } catch {
      // error handled by useData
    } finally {
      setSubmitting(false);
    }
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-[var(--text-tertiary)] bg-[var(--muted-bg)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-strong)] transition-colors"
      >
        <Plus className="size-3" />
        {placeholder}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") {
            setShowInput(false);
            setValue("");
          }
        }}
        placeholder="输入邮箱地址"
        disabled={submitting}
        className="h-6 w-48 px-2 rounded-full text-xs font-mono bg-[var(--muted-bg)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none ring-0 border-none transition-colors"
      />
    </div>
  );
}
