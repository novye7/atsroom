"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  MoreVertical,
  Pencil,
  ArrowUpToLine,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownWrapper } from "../ui/dropdown-wrapper";
import { useData } from "../../data-context";
import { useClipboard } from "../../hooks/use-clipboard";
import { useIsMobile } from "../../hooks/use-mobile";
import { useAliasesCollapseBroadcast } from "../../hooks/use-aliases-collapsed";
import { stringToHsl, validateEmail } from "../../lib/utils";
import type { AccountWithDetails } from "../../types";

// ─── Label Dot ───

function LabelDot({
  name,
  onRemove,
}: {
  name: string;
  onRemove?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const color = stringToHsl(name);

  return (
    <span
      className="relative group/label-dot"
      onMouseLeave={() => setConfirming(false)}
    >
      <button
        onClick={() => {
          if (confirming) {
            onRemove?.();
            setConfirming(false);
          } else {
            setConfirming(true);
          }
        }}
        className="block rounded-full transition-all duration-200 hover:scale-[1.6]"
        style={{
          width: 6,
          height: 6,
          backgroundColor: color,
        }}
        title={confirming ? `确认移除「${name}」` : name}
      />
      {confirming && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] shadow text-[10px] text-[var(--text-secondary)] whitespace-nowrap pointer-events-none z-10">
          移除「{name}」
        </span>
      )}
    </span>
  );
}

// ─── Inline Edit ───

function InlineEdit({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          const v = value.trim();
          if (v && validateEmail(v)) {
            toast.error(validateEmail(v));
            return;
          }
          onSave(v);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={() => {
        const v = value.trim();
        if (v && validateEmail(v)) {
          toast.error(validateEmail(v));
          onCancel();
          return;
        }
        onSave(v);
      }}
      className="h-5 px-1 rounded text-xs font-mono bg-[var(--muted-bg)] text-[var(--text-primary)] outline-none ring-0 border-none"
      style={{ width: `${Math.max(value.length + 2, 10)}ch` }}
    />
  );
}

// ─── Chain connector (link icon) ───

function ChainConnector({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 self-center ${onClick ? "cursor-pointer" : "cursor-default"}`}
      tabIndex={onClick ? 0 : -1}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        className={`text-[var(--accent)] ${onClick ? "hover:text-[var(--accent)]/80 active:scale-90" : ""} transition-transform`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </button>
  );
}

// ─── Collapsed alias indicator (@ circle) ───

function AliasCollapsedBadge({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 self-center w-5 h-5 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-tertiary)] hover:border-[var(--ring-warm)] hover:text-[var(--text-secondary)] active:scale-90 transition-all cursor-pointer"
      title={`${count} 个别名`}
    >
      <svg width="10" height="10" viewBox="3 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
      </svg>
    </button>
  );
}

// ─── CapsuleCard ───

interface CapsuleCardProps {
  account: AccountWithDetails;
}

export function CapsuleCard({ account }: CapsuleCardProps) {
  const {
    deleteAccount,
    createAddress,
    updateAddress,
    deleteAddress,
    promoteAddress,
    removeLabel,
  } = useData();
  const { copy, copiedId } = useClipboard();
  const isMobile = useIsMobile();

  const [editingPrimaryId, setEditingPrimaryId] = useState<number | null>(null);
  const [editingAliasId, setEditingAliasId] = useState<number | null>(null);
  const [addingAlias, setAddingAlias] = useState(false);
  const [aliasesCollapsed, setAliasesCollapsed] = useState(false);

  useAliasesCollapseBroadcast(aliasesCollapsed, setAliasesCollapsed);

  // @dnd-kit sortable — only active on desktop
  const sortableId = `capsule:${account.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: sortableId, disabled: isMobile });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const primaryAddress = account.addresses.find((a) => a.isPrimary);
  const aliases = account.addresses.filter((a) => !a.isPrimary);

  const handleDragStart = useCallback(
    (e: React.DragEvent, addressId: number) => {
      e.dataTransfer.setData(
        "application/address",
        JSON.stringify({ accountId: account.id, addressId })
      );
      e.dataTransfer.effectAllowed = "link";
    },
    [account.id]
  );

  const handleSavePrimary = useCallback(
    async (email: string) => {
      if (!primaryAddress || !email) {
        setEditingPrimaryId(null);
        return;
      }
      if (email !== primaryAddress.email) {
        await updateAddress(account.id, primaryAddress.id, email);
      }
      setEditingPrimaryId(null);
    },
    [primaryAddress, account.id, updateAddress]
  );

  const handleSaveAlias = useCallback(
    async (email: string) => {
      if (!editingAliasId || !email) {
        setEditingAliasId(null);
        return;
      }
      const addr = account.addresses.find((a) => a.id === editingAliasId);
      if (addr && email !== addr.email) {
        await updateAddress(account.id, editingAliasId, email);
      }
      setEditingAliasId(null);
    },
    [editingAliasId, account.id, account.addresses, updateAddress]
  );

  const handleAddAlias = useCallback(
    async (email: string) => {
      if (!email) {
        setAddingAlias(false);
        return;
      }
      try {
        await createAddress(account.id, email);
      } catch {
        // error handled by useData
      }
      setAddingAlias(false);
    },
    [account.id, createAddress]
  );

  if (!primaryAddress) return null;

  const copied = copiedId === `addr-${primaryAddress.id}`;

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`inline-flex flex-wrap items-center gap-1.5 ${isSorting ? "opacity-40" : ""}`}
    >
      {/* -- Main capsule -- */}
      <div
        className="group/capsule inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ring-warm)] hover:shadow-[0px_0px_0px_1px_var(--ring-warm)] pl-3 pr-2 py-1 cursor-default select-none"
        draggable={!isMobile}
        onDragStart={(e) => handleDragStart(e, primaryAddress.id)}
      >
        {/* Drag handle for @dnd-kit sorting -- desktop only */}
        {!isMobile && (
          <span
            suppressHydrationWarning
            {...attributes}
            {...listeners}
            className="opacity-25 group-hover/capsule:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shrink-0 -ml-0.5"
          >
            <GripVertical className="size-3" />
          </span>
        )}

        {/* Email text area -- relative container for overlay actions */}
        <div className="relative min-w-0">
          {editingPrimaryId === primaryAddress.id ? (
            <InlineEdit
              initialValue={primaryAddress.email}
              onSave={handleSavePrimary}
              onCancel={() => setEditingPrimaryId(null)}
            />
          ) : (
            <>
              {/* Email text */}
              <span
                onClick={() => copy(primaryAddress.email, `addr-${primaryAddress.id}`)}
                onDoubleClick={() => !isMobile && setEditingPrimaryId(primaryAddress.id)}
                className="font-mono text-xs text-[var(--text-primary)] cursor-pointer block truncate"
              >
                {primaryAddress.email}
              </span>

              {/* Overlay actions -- fade in on hover */}
              <div
                className={`absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pl-4 transition-opacity duration-200 ${
                  isMobile
                    ? "opacity-100"
                    : "opacity-0 group-hover/capsule:opacity-100"
                }`}
                style={{
                  background: `linear-gradient(to right, transparent, var(--surface) 30%)`,
                }}
              >
                {copied ? (
                  <Check className="size-3 text-green-600 dark:text-green-400" />
                ) : (
                  <button
                    onClick={() => copy(primaryAddress.email, `addr-${primaryAddress.id}`)}
                    className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    title="复制"
                  >
                    <Copy className="size-3" />
                  </button>
                )}
                <DropdownWrapper
                  trigger={
                    <button className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                      <MoreVertical className="size-3" />
                    </button>
                  }
                >
                  {(close) => (
                    <>
                      <div
                        onClick={() => {
                          setEditingPrimaryId(primaryAddress.id);
                          close();
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] hover:bg-[var(--muted-bg)] cursor-pointer transition-colors"
                      >
                        <Pencil className="size-3" />
                        编辑邮箱
                      </div>
                      <div
                        onClick={() => {
                          setAddingAlias(true);
                          close();
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] hover:bg-[var(--muted-bg)] cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" />
                        添加别名
                      </div>
                      <div className="h-px my-1 bg-[var(--border)]" />
                      <div
                        onClick={() => {
                          deleteAccount(account.id);
                          close();
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--error)] hover:bg-[var(--error)]/10 cursor-pointer transition-colors"
                      >
                        <Trash2 className="size-3" />
                        删除
                      </div>
                    </>
                  )}
                </DropdownWrapper>
              </div>
            </>
          )}
        </div>

        {/* Label dots */}
        {primaryAddress.labels.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {primaryAddress.labels.map((label) => (
              <LabelDot
                key={label.id}
                name={label.name}
                onRemove={() => removeLabel(account.id, primaryAddress.id, label.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* -- Alias section -- */}
      {aliases.length > 0 && (
        aliasesCollapsed ? (
          <AliasCollapsedBadge
            count={aliases.length}
            onClick={() => setAliasesCollapsed(false)}
          />
        ) : (
          aliases.map((alias, idx) => (
            <Fragment key={alias.id}>
              <ChainConnector
                onClick={idx === 0 ? () => setAliasesCollapsed(true) : undefined}
              />
              <div
                className="group/alias inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ring-warm)] hover:shadow-[0px_0px_0px_1px_var(--ring-warm)] pl-3 pr-2 py-1 cursor-default select-none"
                draggable={!isMobile}
                onDragStart={(e) => handleDragStart(e, alias.id)}
              >
                {editingAliasId === alias.id ? (
                  <InlineEdit
                    initialValue={alias.email}
                    onSave={handleSaveAlias}
                    onCancel={() => setEditingAliasId(null)}
                  />
                ) : (
                  <>
                    <div className="relative min-w-0">
                      <button
                        onClick={() => copy(alias.email, `addr-${alias.id}`)}
                        onDoubleClick={() => !isMobile && setEditingAliasId(alias.id)}
                        className="font-mono text-xs text-[var(--text-primary)] cursor-pointer block truncate"
                      >
                        {alias.email}
                      </button>

                      {/* Overlay actions */}
                      <div
                        className={`absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pl-3 transition-opacity duration-200 ${
                          isMobile
                            ? "opacity-100"
                            : "opacity-0 group-hover/alias:opacity-100"
                        }`}
                        style={{
                          background: `linear-gradient(to right, transparent, var(--surface) 30%)`,
                        }}
                      >
                        <button
                          onClick={() => promoteAddress(account.id, alias.id)}
                          className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                          title="设为主邮箱"
                        >
                          <ArrowUpToLine className="size-2.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(account.id, alias.id)}
                          className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                          title="删除"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Label dots */}
                    {alias.labels.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        {alias.labels.map((label) => (
                          <LabelDot
                            key={label.id}
                            name={label.name}
                            onRemove={() => removeLabel(account.id, alias.id, label.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Fragment>
          ))
        )
      )}

      {/* -- Adding new alias (inline) -- */}
      {addingAlias && (
        <>
          <ChainConnector />
          <div className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] pl-3 pr-2 py-1">
            <InlineEdit
              initialValue=""
              onSave={handleAddAlias}
              onCancel={() => setAddingAlias(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
