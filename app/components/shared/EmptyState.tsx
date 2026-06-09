"use client";
import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import CopyPromptButton from "./CopyPromptButton";

interface EmptyStateProps {
  /** Big headline, e.g. "No pillars yet" */
  title: string;
  /** One-paragraph explanation of what this tab will hold once populated. */
  body: string;
  /**
   * Prompt file name in /prompts/. Shown as a hint chip the user can copy if
   * they want to paste it manually instead of using the Claude button.
   */
  promptFile?: string;
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
 * GitHub fork, never has to know what &ldquo;Claude Code&rdquo; is.
 */
export default function EmptyState({
  title,
  body,
  promptFile,
  claudePrompt,
  claudeButtonLabel,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const [copied, setCopied] = useState(false);

  const promptPath = promptFile ? `/prompts/${promptFile}` : null;

  function copyPath() {
    if (!promptPath || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(promptPath)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

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
          marginBottom: hasClaudeButton || hasHandButton || promptPath ? "1.6rem" : 0,
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
            marginBottom: promptPath ? "1.2rem" : 0,
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

      {/* Optional prompt-file hint chip (advanced users who want the raw .md) */}
      {promptPath && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--color-cream)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.45rem 0.7rem 0.45rem 0.9rem",
            fontSize: "0.76rem",
            color: "var(--color-text-dim)",
            fontFamily: "monospace",
          }}
        >
          <FileText size={13} strokeWidth={1.8} style={{ color: "var(--color-taupe)" }} />
          <span>{promptPath}</span>
          <button
            type="button"
            onClick={copyPath}
            aria-label="Copy prompt path"
            style={{
              background: copied ? "var(--color-burgundy)" : "#fff",
              border: "1px solid var(--color-border)",
              color: copied ? "#fff" : "var(--color-text-dim)",
              padding: "0.25rem 0.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.7rem",
              fontFamily: "var(--font-body)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            {copied ? (
              <>
                <Check size={10} strokeWidth={2.4} /> Copied
              </>
            ) : (
              <>
                <Copy size={10} strokeWidth={2} /> Copy
              </>
            )}
          </button>
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
          ? "Click → claude.ai opens with the prompt in your clipboard. Paste, wait for the reply, paste the reply back into this tab. No CLI, no setup."
          : "Open claude.ai, paste this prompt, then paste Claude’s reply back into the editor here."}
      </p>
    </div>
  );
}
