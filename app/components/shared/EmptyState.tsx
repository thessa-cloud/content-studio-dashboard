"use client";
import CopyPromptButton from "./CopyPromptButton";

interface EmptyStateProps {
  /** Big headline, e.g. "No pillars yet" */
  title: string;
  /** One-paragraph explanation of what this tab will hold once populated. */
  body: string;
  /**
   * The data-injected prompt builder. When provided, EmptyState renders a
   * primary CopyPromptButton that copies the full text + opens claude.ai
   * in a new tab. This is the Claude Web / Claude Desktop happy path.
   */
  claudePrompt?: () => Promise<string> | string;
  /** Optional override for the Claude button label. */
  claudeButtonLabel?: string;
  /** Optional secondary action (button label + onClick) — used for "Add by hand". */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Shared empty-state card.
 *
 * Two intended paths into a tab once it&apos;s empty:
 *
 *   1. Claude path (default & primary): one button → copies the
 *      data-injected prompt + opens claude.ai. The user pastes, gets a
 *      structured reply, pastes the reply back into the relevant editor.
 *
 *   2. Hand path: secondary button opens the section&apos;s inline editor so
 *      they can type their first row without touching Claude at all.
 *
 * The customer never has to install a CLI, never has to find a file in their
 * GitHub fork, never has to know what &ldquo;Claude Code&rdquo; is. Everything
 * needed for Claude lives inside the button above — the prompt is built with
 * their data baked in, and the round-trip back lands in the editor on this
 * same tab.
 */
export default function EmptyState({
  title,
  body,
  claudePrompt,
  claudeButtonLabel,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const hasClaudeButton = !!claudePrompt;
  const hasHandButton = !!(actionLabel && onAction);

  return (
    <div
      style={{
        background: "#fff",
        border: "2px dashed var(--color-border)",
        borderRadius: "16px",
        padding: "3.25rem 2rem",
        textAlign: "center",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-header)",
          fontSize: "1.35rem",
          marginBottom: "0.65rem",
          color: "var(--color-text)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          color: "var(--color-text-dim)",
          fontSize: "0.9rem",
          marginBottom: hasClaudeButton || hasHandButton ? "1.6rem" : 0,
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>

      {/* Primary CTAs */}
      {(hasClaudeButton || hasHandButton) && (
        <div
          style={{
            display: "inline-flex",
            gap: "0.55rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {hasClaudeButton && (
            <CopyPromptButton
              label={claudeButtonLabel ?? "Copy prompt with my data"}
              buildPrompt={claudePrompt!}
              tone="primary"
            />
          )}
          {hasHandButton && (
            <button
              type="button"
              onClick={onAction}
              style={{
                background: hasClaudeButton ? "#fff" : "var(--color-burgundy)",
                border: hasClaudeButton ? "1px solid var(--color-border)" : "none",
                color: hasClaudeButton ? "var(--color-text)" : "#fff",
                padding: "0.55rem 1.1rem",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: hasClaudeButton ? "none" : "var(--shadow-sm)",
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}

      <p
        style={{
          marginTop: "1.4rem",
          fontSize: "0.72rem",
          color: "var(--color-text-dim)",
          lineHeight: 1.55,
          maxWidth: "440px",
          margin: "1.4rem auto 0",
        }}
      >
        {hasClaudeButton
          ? "Click → claude.ai opens with the prompt already in your clipboard. Paste, wait for the reply, paste the reply back into this tab. No CLI, no setup."
          : "Open claude.ai, paste this prompt, then paste Claude’s reply back into the editor here."}
      </p>
    </div>
  );
}
