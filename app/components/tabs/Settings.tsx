"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import config from "../../../config.json";

/**
 * Settings tab, v1.
 *
 * Three sections:
 *   1. Brand identity, read-only display of config.json values. Customers
 *      edit config.json directly via Claude Code (see hint at bottom).
 *      Live-editing brand name in the browser is intentionally out of
 *      scope, config.json is the single source of truth for everything
 *      that the layout reads at build time (metadata, document title).
 *   2. Theme, interactive picker. Three presets + custom hex. Persists to
 *      localStorage under key "cs-theme" and ThemeProvider hot-applies the
 *      CSS custom properties without a reload.
 *   3. Apify scraper, advisory only. The scrape token lives in Vercel env
 *      vars (server-side) so it never reaches the client bundle.
 *      Surfacing a token field that writes to localStorage would create a
 *      false sense of security and a real XSS exfiltration risk, so we
 *      explicitly do not offer it.
 *   4. Competitors + trigger words, read-only display, "ask Claude Code"
 *      advice. Same reason as brand identity, config.json is the source.
 */

const STORAGE_KEY = "cs-theme";

type Preset = "burgundy" | "dark-pink" | "custom";

type ThemeState = {
  preset: Preset;
  accent: string;
  accentLight: string;
  accentSoft: string;
};

const PRESETS: Record<Exclude<Preset, "custom">, ThemeState> = {
  burgundy: {
    preset: "burgundy",
    accent: "#741616",
    accentLight: "#9a2020",
    accentSoft: "#fdf0f0",
  },
  "dark-pink": {
    preset: "dark-pink",
    accent: "#a8345c",
    accentLight: "#c44878",
    accentSoft: "#fce8ef",
  },
};

// Derive lighter + soft variants from a base accent hex by mixing toward white.
function mixWithWhite(hex: string, ratio: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
}

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function defaultState(): ThemeState {
  const accent = config.theme?.accent ?? "#741616";
  if (accent === PRESETS.burgundy.accent) return PRESETS.burgundy;
  if (accent === PRESETS["dark-pink"].accent) return PRESETS["dark-pink"];
  return {
    preset: "custom",
    accent,
    accentLight: config.theme?.accentLight ?? mixWithWhite(accent, 0.2),
    accentSoft: config.theme?.accentSoft ?? mixWithWhite(accent, 0.92),
  };
}

function readStoredTheme(): ThemeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    if (!parsed.accent || !isValidHex(parsed.accent)) return null;
    const preset: Preset =
      parsed.preset === "burgundy" || parsed.preset === "dark-pink"
        ? parsed.preset
        : "custom";
    return {
      preset,
      accent: parsed.accent,
      accentLight: parsed.accentLight ?? mixWithWhite(parsed.accent, 0.2),
      accentSoft: parsed.accentSoft ?? mixWithWhite(parsed.accent, 0.92),
    };
  } catch {
    return null;
  }
}

function applyToDOM(theme: ThemeState) {
  const root = document.documentElement;
  root.style.setProperty("--color-burgundy", theme.accent);
  root.style.setProperty("--color-burgundy-light", theme.accentLight);
  root.style.setProperty("--color-burgundy-soft", theme.accentSoft);
}

function persist(theme: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // ignore quota / disabled storage
  }
}

export default function Settings() {
  const [theme, setTheme] = useState<ThemeState>(defaultState);
  const [customHex, setCustomHex] = useState<string>(defaultState().accent);
  const [savedFlash, setSavedFlash] = useState<boolean>(false);

  // Hydrate from localStorage after mount, server-rendered HTML never
  // contains the override so the first paint matches config.theme.
  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setTheme(stored);
      setCustomHex(stored.accent);
    }
  }, []);

  function pickPreset(preset: Exclude<Preset, "custom">) {
    const next = PRESETS[preset];
    setTheme(next);
    setCustomHex(next.accent);
    persist(next);
    applyToDOM(next);
    flashSaved();
  }

  function applyCustom() {
    const hex = customHex.trim();
    if (!isValidHex(hex)) return;
    const next: ThemeState = {
      preset: "custom",
      accent: hex,
      accentLight: mixWithWhite(hex, 0.2),
      accentSoft: mixWithWhite(hex, 0.92),
    };
    setTheme(next);
    persist(next);
    applyToDOM(next);
    flashSaved();
  }

  function resetToConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    const fromConfig: ThemeState = {
      preset: "burgundy",
      accent: config.theme?.accent ?? PRESETS.burgundy.accent,
      accentLight: config.theme?.accentLight ?? PRESETS.burgundy.accentLight,
      accentSoft: config.theme?.accentSoft ?? PRESETS.burgundy.accentSoft,
    };
    setTheme(fromConfig);
    setCustomHex(fromConfig.accent);
    applyToDOM(fromConfig);
    flashSaved();
  }

  function flashSaved() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }

  const customHexValid = isValidHex(customHex);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <h1 style={{
        fontFamily: "var(--font-header)",
        fontSize: "2rem",
        marginBottom: "0.5rem",
      }}>
        Settings
      </h1>
      <p style={{ color: "var(--color-text-dim)", marginBottom: "2rem" }}>
        Configure your brand, theme, and scrape source.
      </p>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Brand</h2>
        <Row label="Brand name" value={config.brandName} />
        <Row label="Instagram handle" value={`@${config.instagramHandle}`} />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Theme</h2>
        <p style={paragraphStyle}>
          Pick a preset or set a custom accent. The change applies instantly and is
          remembered in this browser. Use the reset button to fall back to your
          deploy default.
        </p>

        <div style={presetGridStyle}>
          <PresetTile
            label="Burgundy"
            sample={PRESETS.burgundy.accent}
            active={theme.preset === "burgundy"}
            onClick={() => pickPreset("burgundy")}
          />
          <PresetTile
            label="Dark pink"
            sample={PRESETS["dark-pink"].accent}
            active={theme.preset === "dark-pink"}
            onClick={() => pickPreset("dark-pink")}
          />
          <PresetTile
            label="Custom"
            sample={theme.preset === "custom" ? theme.accent : "#cccccc"}
            active={theme.preset === "custom"}
            onClick={() => {
              const next: ThemeState = {
                preset: "custom",
                accent: customHex,
                accentLight: mixWithWhite(customHex, 0.2),
                accentSoft: mixWithWhite(customHex, 0.92),
              };
              if (isValidHex(customHex)) {
                setTheme(next);
                persist(next);
                applyToDOM(next);
                flashSaved();
              }
            }}
          />
        </div>

        <div style={customRowStyle}>
          <label htmlFor="custom-hex" style={hexLabelStyle}>Custom hex</label>
          <input
            id="custom-hex"
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#741616"
            spellCheck={false}
            style={{
              ...inputStyle,
              borderColor: customHexValid
                ? "var(--color-border)"
                : "var(--color-burgundy-light)",
            }}
          />
          <input
            aria-label="Color preview"
            type="color"
            value={customHexValid ? customHex : "#741616"}
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              setCustomHex(hex);
              // Live-apply so dragging the swatch retints the page
              // immediately, no separate "Apply" click needed. We still
              // expose the Apply button for keyboard-only users typing in
              // the text field.
              if (isValidHex(hex)) {
                const next: ThemeState = {
                  preset: "custom",
                  accent: hex,
                  accentLight: mixWithWhite(hex, 0.2),
                  accentSoft: mixWithWhite(hex, 0.92),
                };
                setTheme(next);
                persist(next);
                applyToDOM(next);
              }
            }}
            style={colorChipStyle}
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customHexValid}
            style={applyButtonStyle}
          >
            Apply
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <button type="button" onClick={resetToConfig} style={resetButtonStyle}>
            Reset to deploy default
          </button>
          {savedFlash && (
            <span style={savedFlashStyle}>
              <Check size={14} strokeWidth={2.4} /> Saved
            </span>
          )}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Apify scraper</h2>
        <p style={paragraphStyle}>
          Your Apify token lives in your Vercel project as the
          <code style={codeStyle}>APIFY_TOKEN</code> environment variable, used
          by the Supabase Edge Function. It is never sent to the browser.
        </p>
        <p style={paragraphStyle}>
          To rotate or change it, open Vercel
          <span style={dotStyle}>·</span> Project Settings
          <span style={dotStyle}>·</span> Environment Variables, update
          <code style={codeStyle}>APIFY_TOKEN</code>, then redeploy.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Competitors</h2>
        {config.competitors.length === 0 ? (
          <p style={paragraphStyle}>
            No competitor handles yet. Add up to 5 in
            <code style={codeStyle}>config.json</code> or ask Claude Code to do
            it for you.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {config.competitors.map((handle: string) => (
              <li key={handle} style={{ padding: "0.5rem 0" }}>@{handle}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ ...sectionStyle, borderBottom: "none" }}>
        <h2 style={h2Style}>Trigger words</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {config.triggerWords.map((word: string) => (
            <span key={word} style={pillStyle}>{word}</span>
          ))}
        </div>
      </section>

      <p style={tipBoxStyle}>
        <strong>Tip:</strong> ask Claude Code to update brand name, competitors,
        or trigger words for you. Example:{" "}
        <em>&quot;Add @username to my competitors and refresh the Intel tab.&quot;</em>
      </p>
    </div>
  );
}

function PresetTile({
  label,
  sample,
  active,
  onClick,
}: {
  label: string;
  sample: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        ...presetTileStyle,
        borderColor: active ? "var(--color-burgundy)" : "var(--color-border)",
        boxShadow: active ? "var(--shadow-burgundy)" : "var(--shadow-xs)",
        background: active ? "var(--color-burgundy-soft)" : "#fff",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "block",
          width: "100%",
          height: 28,
          borderRadius: 6,
          background: sample,
          border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 10,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: "ui-monospace, monospace",
          color: "var(--color-text-dim)",
          marginTop: 2,
        }}
      >
        {sample.toUpperCase()}
      </span>
    </button>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.6rem 0",
      borderBottom: "1px dashed var(--color-border-light)",
    }}>
      <span style={{ color: "var(--color-text-dim)", fontSize: 14 }}>{label}</span>
      <span style={{ color: "var(--color-text)", fontSize: 14, fontWeight: 500 }}>
        {value}
        {children}
      </span>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  paddingBottom: "1.5rem",
  borderBottom: "1px solid var(--color-border-light)",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-header)",
  fontSize: "1.15rem",
  marginBottom: "1rem",
  color: "var(--color-text)",
};

const paragraphStyle: React.CSSProperties = {
  color: "var(--color-text-dim)",
  fontSize: 14,
  lineHeight: 1.55,
  marginBottom: 12,
};

const presetGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const presetTileStyle: React.CSSProperties = {
  appearance: "none",
  textAlign: "left",
  padding: "14px 14px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  background: "#fff",
};

const customRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const hexLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-dim)",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  flex: "1 1 160px",
  minWidth: 0,
  padding: "0.6rem 0.85rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "#fff",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.9rem",
};

const colorChipStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  padding: 0,
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  background: "transparent",
  cursor: "pointer",
};

const applyButtonStyle: React.CSSProperties = {
  padding: "0.55rem 1rem",
  border: "1px solid var(--color-burgundy)",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-burgundy)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const resetButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.9rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-pill)",
  background: "#fff",
  color: "var(--color-text)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const savedFlashStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 13,
  color: "var(--color-burgundy)",
  fontWeight: 600,
};

const codeStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.85em",
  background: "var(--color-cream)",
  padding: "0.1rem 0.35rem",
  borderRadius: 4,
  margin: "0 0.2rem",
};

const dotStyle: React.CSSProperties = {
  display: "inline-block",
  margin: "0 6px",
  color: "var(--color-text-dim)",
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.4rem 0.85rem",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-burgundy-soft)",
  color: "var(--color-burgundy)",
  fontSize: "0.85rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
};

const tipBoxStyle: React.CSSProperties = {
  marginTop: "3rem",
  padding: "1rem",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-cream)",
  color: "var(--color-text-dim)",
  fontSize: 13,
  lineHeight: 1.6,
};
