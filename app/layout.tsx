import type { Metadata } from "next";
import "./globals.css";
import config from "../config.json";
import ThemeProvider from "./components/ThemeProvider";

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

// Blocking inline script, runs BEFORE first paint in <head>. Without this,
// returning visitors who picked dark-pink (or custom) would see a ~100ms
// burgundy flash on every navigation while React hydrates and ThemeProvider's
// useEffect runs. The script reads localStorage["cs-theme"], validates each
// hex against /^#[0-9a-fA-F]{6}$/, and pushes onto :root via setProperty so
// the very first paint already shows the persisted theme.
//
// XSS guard, only validated 6-digit hex strings reach setProperty. Anything
// else is silently ignored and falls through to the build-time defaults.
const THEME_PREHYDRATE = `
(function(){
  try {
    var raw = localStorage.getItem("cs-theme");
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var hex = /^#[0-9a-fA-F]{6}$/;
    var pairs = [
      ["accent", "--color-burgundy"],
      ["accentLight", "--color-burgundy-light"],
      ["accentSoft", "--color-burgundy-soft"]
    ];
    var root = document.documentElement;
    for (var i = 0; i < pairs.length; i++) {
      var v = parsed && parsed[pairs[i][0]];
      if (typeof v === "string" && hex.test(v)) {
        root.style.setProperty(pairs[i][1], v);
      }
    }
  } catch (e) { /* fall back to build-time defaults */ }
})();
`.trim();

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
        <script dangerouslySetInnerHTML={{ __html: THEME_PREHYDRATE }} />
      </head>
      <body style={{ minHeight: "100%" }}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
