"use client";

import { useEffect } from "react";
import { AppNav } from "./app-nav";
import { CapsuleList } from "../capsules/capsule-list";
import { initFaviconDetect } from "../../lib/favicon-detect";

export function AppShell() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      // Only auto-sync when user hasn't explicitly chosen a theme
      const stored = localStorage.getItem("howmanyat-theme");
      if (!stored) {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    initFaviconDetect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <CapsuleList />
        </div>
      </main>
    </div>
  );
}
