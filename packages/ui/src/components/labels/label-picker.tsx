"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useData } from "../../data-context";

interface LabelPickerProps {
  addressId: number;
  accountId: number;
  selectedLabelIds: number[];
  onClose: () => void;
}

export function LabelPicker({
  addressId,
  accountId,
  selectedLabelIds,
  onClose,
}: LabelPickerProps) {
  const { labels, addLabel, createLabel, removeLabel } = useData();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const filtered = labels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = useCallback(
    async (labelId: number, isSelected: boolean) => {
      if (isSelected) {
        await removeLabel(accountId, addressId, labelId);
      } else {
        const label = labels.find((l) => l.id === labelId);
        if (label) {
          await addLabel(accountId, addressId, label.name);
        }
      }
    },
    [accountId, addressId, addLabel, removeLabel, labels]
  );

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    const label = await createLabel(name);
    if (label) {
      await addLabel(accountId, addressId, label.name);
    }
    setCreating(false);
    setNewName("");
  }, [newName, createLabel, addLabel, accountId, addressId]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-1 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-whisper)_0px_4px_24px] p-2"
    >
      {/* Search */}
      <div className="relative mb-1.5">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-tertiary)]" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标签"
          className="w-full h-7 pl-7 pr-2 rounded-lg text-xs bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--input-focus)]"
        />
      </div>

      {/* Label list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {filtered.map((label) => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              onClick={() => handleToggle(label.id, isSelected)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:bg-[var(--muted-bg)] transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {isSelected && <Check className="size-3 text-[var(--accent)]" />}
              </span>
              <span className="text-[var(--text-primary)] truncate">{label.name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && !creating && (
          <button
            onClick={() => {
              setCreating(true);
              setNewName(search);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[var(--accent)] hover:bg-[var(--muted-bg)] transition-colors"
          >
            <Plus className="size-3" />
            创建 &ldquo;{search}&rdquo;
          </button>
        )}
      </div>

      {/* Inline create */}
      {creating && (
        <div className="mt-1.5 flex items-center gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="标签名"
            autoFocus
            className="flex-1 h-7 px-2 rounded-lg text-xs bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
          <button
            onClick={handleCreate}
            className="h-7 px-2 rounded-lg text-xs bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            创建
          </button>
        </div>
      )}
    </div>
  );
}
