"use client";

import { DexieDataProvider } from "@/hooks/dexie-data-provider";
import { AppShell } from "@howmanyat/ui/components/layout/app-shell";

export default function HomePage() {
  return (
    <DexieDataProvider>
      <AppShell />
    </DexieDataProvider>
  );
}
