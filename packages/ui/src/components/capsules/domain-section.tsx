"use client";

import { useMemo } from "react";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { CapsuleCard } from "./capsule-card";
import { useIsMobile } from "../../hooks/use-mobile";
import { isGlobeFavicon } from "../../lib/favicon-detect";
import type { AccountWithDetails } from "../../types";

interface DomainSectionProps {
  id: string;
  domain: string;
  accounts: AccountWithDetails[];
  isDragging?: boolean;
}

export function DomainSection({ id, domain, accounts, isDragging }: DomainSectionProps) {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled: isMobile });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const capsuleIds = useMemo(
    () => accounts.map((a) => `capsule:${a.id}`),
    [accounts]
  );

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`mb-10 ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Domain header — draggable on desktop */}
      <div className="flex items-center gap-2 mb-2 group/domain">
        {/* Favicon — fetch at 64px for sharp rendering, display at 16px */}
        <img
          crossOrigin="anonymous"
          src={faviconUrl}
          alt=""
          width={16}
          height={16}
          className="shrink-0 rounded-sm"
          onLoad={(e) => {
            if (isGlobeFavicon(e.currentTarget)) {
              const img = e.currentTarget;
              if (!img.src.includes("mail.")) {
                img.src = `https://www.google.com/s2/favicons?domain=mail.${domain}&sz=64`;
              } else {
                img.style.display = "none";
              }
            }
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes("mail.")) {
              img.src = `https://www.google.com/s2/favicons?domain=mail.${domain}&sz=64`;
            } else {
              img.style.display = "none";
            }
          }}
        />
        <span className="font-serif font-medium italic text-[16px] text-[var(--text-primary)]">
          {domain}
        </span>
        <span className="flex-1 border-t border-[var(--border)]" />
        {/* Count badge / drag handle — shared slot */}
        <span className="relative shrink-0 w-6 h-6 flex items-center justify-center">
          {/* Count circle — fades out on hover (desktop) */}
          <span
            className={`text-[10px] tabular-nums text-[var(--text-tertiary)] w-5 h-5 flex items-center justify-center rounded-full border border-[var(--border)] transition-opacity ${
              isMobile ? "" : "group-hover/domain:opacity-0"
            }`}
          >
            {accounts.length}
          </span>
          {/* Drag handle — fades in on hover (desktop) */}
          {!isMobile && (
            <span
              suppressHydrationWarning
              {...attributes}
              {...listeners}
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] opacity-0 group-hover/domain:opacity-100 transition-opacity"
            >
              <GripVertical className="size-3.5" />
            </span>
          )}
        </span>
      </div>

      {/* Capsules in sortable flex-wrap layout */}
      <SortableContext items={capsuleIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-1.5">
          {accounts.map((account) => (
            <CapsuleCard key={account.id} account={account} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
