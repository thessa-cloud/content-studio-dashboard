"use client";

import { useEffect } from "react";

/**
 * ThemeProvider, runtime theme override.
 *
 * Build-time `config.theme` lives in config.json + layout.tsx, which inlines
 * a <style> block in <head> at build time. That works for "ship once and
 * forget", but it does not let a customer pick a different accent after
 * deploy without editing config.json + redeploying.
 *
 * This component runs ONLY on the client. On mount it reads
 * `localStorage["cs-theme"]` (a JSON blob written by the Settings tab) and
 * pushes each key onto `:root` via `style.setProperty`. CSS custom
 * properties cascade, so every component that already reads
 * `var(--color-burgundy)` etc. retints live, no rerender needed.
 *
 * Storage shape (kept tiny, no migration story needed):
 *   {
 *     preset: "burgundy" | "dark-pink" | "custom",
 *     accent: "#741616",
 *     accentLight: "#9a2020",
 *     accentSoft: "#fdf0f0"
 *   }
 *
 * Fallback: if localStorage is empty or invalid, we do nothing and the
 * build-time defaults from layout.tsx + globals.css stay in place.
 *
 * Forbidden: writing user-supplied accent values into a server-side store.
 * Theme is per-browser cosmetics, no privacy concern, localStorage is the
 * right scope.
 */

const STORAGE_KEY = "cs-theme";

const VAR_MAP: Record<string, string> = {
  accent: "--color-burgundy",
  accentLight: "--color-burgundy-light",
  accentSoft: "--color-burgundy-soft",
};

type StoredTheme = {
  preset?: string;
  accent?: string;
  accentLight?: string;
  accentSoft?: string;
};

function isValidHex(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value)
  );
}

function applyTheme(theme: StoredTheme) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(VAR_MAP)) {
    const value = theme[key as keyof StoredTheme];
    if (isValidHex(value)) {
      root.style.setProperty(cssVar, value);
    }
  }
}

export default function ThemeProvider() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredTheme;
      applyTheme(parsed);
    } catch {
      // Corrupt JSON or storage disabled, fall back to build-time theme.
    }

    // Cross-tab sync, if Settings is open in another tab and saves,
    // we retint here without a reload.
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== STORAGE_KEY || !ev.newValue) return;
      try {
        const parsed = JSON.parse(ev.newValue) as StoredTheme;
        applyTheme(parsed);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
