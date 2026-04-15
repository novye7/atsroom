"use client";

import { useState, useCallback } from "react";

export function useClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback((text: string, id?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (id) setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return { copy, copiedId };
}
