"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * CopyPromptButton.
 *
 * The bridge between the dashboard and Claude Web / Claude Desktop.
 *
 * The customer opens claude.ai (or the desktop app), pastes one of our 12 fat
 * prompts, and gets back a structured answer they paste back into the dash.
 *
 * We can't run Claude for them. What we CAN do is give them one button that:
 *
 *   1. Loads the prompt template (from /prompts/<n>.md, embedded at build time)
 *   2. Fetches their freshest scraped data from /api/data
 *   3. Splices the data INTO the prompt as a fenced "DATA" block
 *   4. Copies the whole thing to clipboard
 *   5. Pops a window into claude.ai with focus
 *
 * Customer flow: click → paste in Claude → wait for answer → paste back. Done.
 *
 * Props:
 *  - label             button text ("Copy prompt with my data")
 *  - buildPrompt       async () => string. The data-injected prompt to copy.
 *  - claudeUrl         optional override (default: https://claude.ai/new)
 *  - tone              "primary" | "secondary"  (visual)
 *  - disabled          show but unclickable
 *  - disabledReason    tooltip when disabled
 */
export default function CopyPromptButton({
  label = "Copy prompt with my data",
  buildPrompt,
  claudeUrl = "https://claude.ai/new",
  tone = "primary",
  disabled = false,
  disabledReason,
}: {
  label?: string;
  buildPrompt: () => Promise<string> | string;
  claudeUrl?: string;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");

  const onClick = async () => {
    if (disabled) return;
    setState("loading");
    try {
      const prompt = await buildPrompt();
      await navigator.clipboard.writeText(prompt);
      setState("copied");
      // Pop a new tab to Claude. Best effort, popups may be blocked. The
      // clipboard write already succeeded, so they can paste manually.
      window.open(claudeUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => setState("idle"), 3500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  const isPrimary = tone === "primary";
  const bg = disabled
    ? "var(--color-cream)"
    : isPrimary
    ? "var(--color-burgundy)"
    : "#fff";
  const fg = disabled
    ? "var(--color-text-dim)"
    : isPrimary
    ? "#fff"
    : "var(--color-text)";
  const border = isPrimary
    ? "1px solid var(--color-burgundy)"
    : "1px solid var(--color-border)";

  let icon: React.ReactNode = <Copy size={13} strokeWidth={2} />;
  let text = label;
  if (state === "loading") {
    text = "Preparing…";
  } else if (state === "copied") {
    icon = <Check size={13} strokeWidth={2.2} />;
    text = "Copied. Paste in Claude →";
  } else if (state === "error") {
    text = "Could not copy. Try again";
  } else if (!disabled) {
    icon = <ExternalLink size={13} strokeWidth={2} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "loading"}
      title={disabled ? disabledReason : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        background: bg,
        color: fg,
        border,
        padding: "0.55rem 1rem",
        borderRadius: "10px",
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: disabled || state === "loading" ? "not-allowed" : "pointer",
        fontFamily: "var(--font-body)",
        opacity: disabled ? 0.7 : 1,
        transition: "background 160ms ease, transform 120ms ease",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

// `fenceData` used to live here; it has been moved to `lib/fenceData.ts` so
// it's importable from server components / route handlers without dragging
// this client module into the server graph. Re-exported here for back-compat
// with any existing imports.
export { fenceData } from "../../../lib/fenceData";
