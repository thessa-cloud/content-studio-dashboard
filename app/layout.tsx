import type { Metadata } from "next";
import "./globals.css";
import config from "../config.json";

/**
 * Root layout.
 *
 * Reads `config.json` at build time and:
 *   1. Uses `brandName` + `tagline` for the document title / description.
 *   2. Emits a small inline <style> block that overrides the CSS variables
 *      defined in globals.css using the values from `config.theme`.
 *
 * Result: a customer changes one file (config.json) → the entire dashboard
 * retints on next deploy. No code edits needed.
 */

const theme = (config.theme ?? {}) as Record<string, string | undefined>;

export const metadata: Metadata = {
  title: `${config.brandName ?? "Content Studio"} · Content Studio`,
  description: config.tagline ?? "Your content intelligence dashboard.",
};

// Map config.theme keys → CSS custom properties. Missing keys fall back to
// the defaults already declared in globals.css (REVENU classic).
const themeOverrides: Record<string, string | undefined> = {
  "--color-burgundy": theme.accent,
  "--color-burgundy-light": theme.accentLight,
  "--color-burgundy-soft": theme.accentSoft,
  "--color-cream": theme.cream,
  "--color-cream-deep": theme.creamDeep,
  "--color-bg": theme.bg,
};

const themeCss = Object.entries(themeOverrides)
  .filter(([, v]) => typeof v === "string" && v.length > 0)
  .map(([k, v]) => `  ${k}: ${v};`)
  .join("\n");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        {themeCss && (
          <style
            // Inline at the top of <head> so it overrides globals.css :root vars
            dangerouslySetInnerHTML={{ __html: `:root {\n${themeCss}\n}` }}
          />
        )}
      </head>
      <body style={{ minHeight: "100%" }}>{children}</body>
    </html>
  );
}
