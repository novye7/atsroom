"use client";

import { useCallback, useSyncExternalStore } from "react";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  const theme = dark ? "dark" : "light";
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
  try { localStorage.setItem("howmanyat-theme", theme); } catch {}
}

export function useDarkMode() {
  const isDark = useSyncExternalStore(
    (callback) => {
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", callback);
      return () => {
        observer.disconnect();
        mq.removeEventListener("change", callback);
      };
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggle = useCallback(() => {
    applyTheme(!isDark);
  }, [isDark]);

  return { isDark, toggle };
}
