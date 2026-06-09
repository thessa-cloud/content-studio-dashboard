"use client";
import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";

interface EmptyStateProps {
  /** Big headline, e.g. "No pillars yet" */
  title: string;
  /** One-paragraph explanation of what this tab will hold once populated. */
  body: string;
  /**
   * Prompt file name in /prompts/ that fills this tab.
   * If supplied, the empty state shows a one-click copy button for the prompt path
   * so the user can paste it straight into Claude Code.
   */
  promptFile?: string;
  /** Optional secondary action (button label + onClick). */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Shared empty-state card.
 *
 * Pattern: every tab on a fresh install shows nothing until Claude Code runs the
 * matching prompt. EmptyState explains the gap, names the prompt, and lets the
 * user copy the path so they can paste it into Claude Code in one second.
 */
export default function EmptyState({
  title,
  body,
  promptFile,
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

  return (
    <div
      style={{
        background: "#fff",
        border: "2px dashed var(--color-border)",
        borderRadius: "16px",
        padding: "3.5rem 2rem",
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
          marginBottom: promptPath || actionLabel ? "1.75rem" : 0,
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>

      {promptPath && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--color-cream)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.55rem 0.75rem 0.55rem 1rem",
            fontSize: "0.82rem",
            color: "var(--color-text)",
            fontFamily: "monospace",
            marginBottom: actionLabel ? "1rem" : 0,
          }}
        >
          <FileText size={14} strokeWidth={1.8} style={{ color: "var(--color-taupe)" }} />
          <span>{promptPath}</span>
          <button
            type="button"
            onClick={copyPath}
            aria-label="Copy prompt path"
            style={{
              background: copied ? "var(--color-burgundy)" : "#fff",
              border: "1px solid var(--color-border)",
              color: copied ? "#fff" : "var(--color-text-dim)",
              padding: "0.3rem 0.55rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontFamily: "var(--font-body)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            {copied ? (
              <>
                <Check size={11} strokeWidth={2.4} /> Copied
              </>
            ) : (
              <>
                <Copy size={11} strokeWidth={2} /> Copy
              </>
            )}
          </button>
        </div>
      )}

      {actionLabel && onAction && (
        <div style={{ marginTop: promptPath ? "0.75rem" : 0 }}>
          <button
            onClick={onAction}
            style={{
              background: "var(--color-burgundy)",
              border: "none",
              color: "#fff",
              padding: "0.6rem 1.4rem",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}

      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.72rem",
          color: "var(--color-text-dim)",
          lineHeight: 1.5,
        }}
      >
        Open the project in Claude Code, paste the prompt path, and this tab populates itself.
      </p>
    </div>
  );
}
