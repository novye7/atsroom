"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Moon, Sun, Eye, EyeOff, Plus, Pencil, Trash2, X } from "lucide-react";
import { useDarkMode } from "../../hooks/use-dark-mode";
import { useAliasesCollapsed } from "../../hooks/use-aliases-collapsed";
import { useData } from "../../data-context";
import { stringToHsl } from "../../lib/utils";
import type { LabelSimple } from "../../types";

export function AppNav() {
  const { isDark, toggle } = useDarkMode();
  const { command: aliasesState, collapseAll, expandAll } = useAliasesCollapsed();
  const {
    labels,
    filterLabelIds,
    setFilterLabelIds,
    addLabel,
    createLabel,
    deleteLabel,
    updateLabel,
  } = useData();

  const isAll = filterLabelIds.length === 0;

  // ─── Label creation state ───
  const [showCreate, setShowCreate] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreate) createRef.current?.focus();
  }, [showCreate]);

  const handleCreate = useCallback(async () => {
    const name = createValue.trim();
    if (!name) return;
    await createLabel(name);
    setCreateValue("");
    setShowCreate(false);
  }, [createValue, createLabel]);

  // ─── Label editing state (right-click rename) ───
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  const handleRename = useCallback(async () => {
    if (editingId === null) return;
    const name = editValue.trim();
    if (name) await updateLabel(editingId, name);
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, updateLabel]);

  // ─── Context menu ───
  const [contextMenu, setContextMenu] = useState<{
    labelId: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu]);

  // ─── Drag-over state for drop animation ───
  const [dragOverLabelId, setDragOverLabelId] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "link";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, label: LabelSimple) => {
      e.preventDefault();
      setDragOverLabelId(null);
      const data = e.dataTransfer.getData("application/address");
      if (!data) return;
      try {
        const { accountId, addressId } = JSON.parse(data);
        addLabel(accountId, addressId, label.name);
      } catch {
        // ignore
      }
    },
    [addLabel]
  );

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--surface)]/80 border-b border-[var(--border)]">
      <div className="max-w-4xl mx-auto px-4 flex items-center h-11 gap-3">
        {/* Left: filter chips + labels */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
          <button
            onClick={() => setFilterLabelIds([])}
            title="显示全部邮箱"
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              isAll
                ? "bg-[var(--accent)] text-[var(--accent-text)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            全部
          </button>

          {labels.map((label) => {
            const active = filterLabelIds.includes(label.id);
            const color = stringToHsl(label.name);
            const isDragOver = dragOverLabelId === label.id;
            const isEditing = editingId === label.id;

            if (isEditing) {
              return (
                <input
                  key={label.id}
                  ref={editRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleRename(); }
                    if (e.key === "Escape") { setEditingId(null); setEditValue(""); }
                  }}
                  onBlur={handleRename}
                  className="shrink-0 w-20 px-2 py-0.5 rounded-full text-xs bg-[var(--muted-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-0 focus:border-none border-none"
                />
              );
            }

            return (
              <button
                key={label.id}
                title={`筛选：${label.name}\n右键：重命名 / 删除\n拖拽邮箱到此：添加标签`}
                onClick={() => {
                  if (active) {
                    setFilterLabelIds(filterLabelIds.filter((id) => id !== label.id));
                  } else {
                    setFilterLabelIds([...filterLabelIds, label.id]);
                  }
                }}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragOverLabelId(label.id)}
                onDragLeave={() => setDragOverLabelId((prev) => prev === label.id ? null : prev)}
                onDrop={(e) => handleDrop(e, label)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ labelId: label.id, x: e.clientX, y: e.clientY });
                }}
                style={active ? { backgroundColor: color } : undefined}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  isDragOver
                    ? "scale-110 ring-2 ring-[var(--accent)] shadow-md bg-[var(--accent)]/10"
                    : active
                      ? "text-white"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--muted-bg)]"
                }`}
              >
                {label.name}
              </button>
            );
          })}

          {/* Create label */}
          {showCreate ? (
            <div className="shrink-0 flex items-center gap-0.5">
              <input
                ref={createRef}
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowCreate(false); setCreateValue(""); }
                }}
                onBlur={() => { if (!createValue.trim()) setShowCreate(false); }}
                placeholder="标签名"
                className="w-20 px-2 py-0.5 rounded-full text-xs bg-[var(--muted-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-0 focus:border-none border-none"
              />
              <button
                onClick={() => { setShowCreate(false); setCreateValue(""); }}
                title="取消"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              title="创建新标签"
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--muted-bg)] transition-colors"
            >
              <Plus className="size-3" />
            </button>
          )}
        </div>

        {/* Right: logo + actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-serif font-medium text-sm text-[var(--text-primary)] mr-1">
            At's Room
          </span>
          <button
            onClick={() => aliasesState === "collapse" ? expandAll() : collapseAll()}
            title={aliasesState === "collapse" ? "展开所有别名" : "收起所有别名"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-bg)] transition-colors"
          >
            {aliasesState === "collapse" ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </button>
          <button
            onClick={toggle}
            title={isDark ? "切换亮色模式" : "切换暗色模式"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-bg)] transition-colors"
          >
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Context menu for label rename / delete */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={async () => {
              const label = labels.find((l) => l.id === contextMenu.labelId);
              if (label) {
                setEditingId(label.id);
                setEditValue(label.name);
              }
              setContextMenu(null);
            }}
            title="重命名标签"
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--muted-bg)] transition-colors"
          >
            <Pencil className="size-3" />
            重命名
          </button>
          <button
            onClick={async () => {
              await deleteLabel(contextMenu.labelId);
              setContextMenu(null);
            }}
            title="删除标签"
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
          >
            <Trash2 className="size-3" />
            删除
          </button>
        </div>
      )}
    </nav>
  );
}
