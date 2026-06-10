"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  markAsLegacy,
  updateLegacy,
  unmarkLegacy,
  DEFAULT_RECYCLE_INTERVAL_DAYS,
  type LegacyPiece,
  type LegacyType,
  type LegacyRecycleStatus,
  type LegacySourceType,
} from "../../../lib/legacy";

/**
 * Mark-as-legacy modal — used by Vault (to mark library_posts) and Drafts
 * (to mark posted drafts). Same form whether marking fresh or editing an
 * already-marked piece.
 *
 * Standalone-legacy entries use the StandaloneLegacyModal instead (the form
 * surface is different — it captures hook/caption/posted_at).
 *
 * UX: starts with recycle_status='paused' (opt-in). Toggle reveals the
 * interval picker (4 weeks default — Thessa's preference). Performance note
 * is optional free-text. Unmark button only appears when editing an existing
 * legacy row.
 */

export type MarkLegacyModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  // Identity of what we're marking. For new marks, existing is null.
  source_type: LegacySourceType;
  source_id: string;
  type: LegacyType;
  // Source snapshot (denormalized into the legacy row so it survives source deletion).
  source_hook?: string | null;
  source_caption?: string | null;
  source_posted_at?: string | null;
  // If editing an already-marked piece, pre-fill from it.
  existing?: LegacyPiece | null;
};

export default function MarkLegacyModal({
  open,
  onClose,
  onSaved,
  source_type,
  source_id,
  type,
  source_hook,
  source_caption,
  source_posted_at,
  existing = null,
}: MarkLegacyModalProps) {
  const isEdit = existing !== null;

  const [performanceNote, setPerformanceNote] = useState("");
  const [recycleStatus, setRecycleStatus] = useState<LegacyRecycleStatus>("paused");
  const [intervalDays, setIntervalDays] = useState(DEFAULT_RECYCLE_INTERVAL_DAYS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setPerformanceNote(existing.performance_note ?? "");
      setRecycleStatus(existing.recycle_status);
      setIntervalDays(existing.recycle_interval_days);
    } else {
      setPerformanceNote("");
      setRecycleStatus("paused");
      setIntervalDays(DEFAULT_RECYCLE_INTERVAL_DAYS);
    }
    setError(null);
  }, [open, existing]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && existing) {
        const updated = await updateLegacy({
          id: existing.id,
          performance_note: performanceNote.trim() || null,
          recycle_status: recycleStatus,
          recycle_interval_days: intervalDays,
        });
        if (!updated) throw new Error("Update failed");
      } else {
        // This modal is referenced-only (library_post / draft). Standalone
        // legacies go through StandaloneLegacyModal because their form
        // surface owns hook/caption/posted_at/thumb_url directly. Refuse
        // explicitly instead of silently rewriting source_type — the
        // earlier defensive ternary would have created dangling references
        // by stamping a "library_post" type onto a source_id that doesn't
        // exist in library_posts.
        if (source_type === "standalone") {
          throw new Error("Use StandaloneLegacyModal for standalone legacies.");
        }
        const created = await markAsLegacy({
          source_type,
          source_id,
          type,
          hook: source_hook ?? undefined,
          caption: source_caption ?? undefined,
          posted_at: source_posted_at ?? undefined,
          performance_note: performanceNote.trim() || undefined,
          recycle_status: recycleStatus,
          recycle_interval_days: intervalDays,
        });
        if (!created) throw new Error("Mark failed");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnmark = async () => {
    if (!existing) return;
    if (!confirm("Unmark this piece as legacy? It will stop auto-recycling. The source row is untouched.")) return;
    setSaving(true);
    try {
      const ok = await unmarkLegacy(existing.id);
      if (!ok) throw new Error("Unmark failed");
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 18, 16, 0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "520px",
          padding: "1.6rem",
          boxShadow: "var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.18))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.2rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>
              {isEdit ? "Edit legacy piece" : "Mark as legacy"}
            </h3>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--color-text-dim)" }}>
              {isEdit
                ? "Adjust recycle config or unmark."
                : "Save this as a winner. Optionally auto-clone into a fresh draft every X weeks."}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-dim)",
            }}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Field label="Performance note (optional)" hint="e.g. 20k views in 24h, best converting story this month">
            <textarea
              value={performanceNote}
              onChange={(e) => setPerformanceNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Why is this a winner?"
              style={textareaStyle}
            />
          </Field>

          <Field label="Auto-recycle">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={recycleStatus === "active"}
                  onChange={(e) => setRecycleStatus(e.target.checked ? "active" : "paused")}
                />
                <span style={{ fontSize: "0.85rem" }}>
                  Auto-clone into a fresh draft every X weeks
                </span>
              </label>
              {recycleStatus === "active" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "1.6rem" }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--color-text-dim)" }}>Every</label>
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value) || DEFAULT_RECYCLE_INTERVAL_DAYS)}
                    style={{ ...inputStyle, width: "80px" }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-dim)" }}>
                    days ({Math.round(intervalDays / 7)} weeks)
                  </span>
                </div>
              )}
              <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", margin: 0 }}>
                Recycled drafts land in your Drafts tab with status &quot;draft&quot; — you always review before posting.
              </p>
            </div>
          </Field>

          {error && (
            <div
              style={{
                background: "#fde9e3",
                border: "1px solid #e9b1a3",
                color: "#8a3219",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", marginTop: "0.4rem" }}>
            {isEdit ? (
              <button onClick={handleUnmark} disabled={saving} style={destructiveButtonStyle}>
                Unmark
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={onClose} disabled={saving} style={secondaryButtonStyle}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Mark as legacy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-text-dim)" }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  fontFamily: "var(--font-body)",
  outline: "none",
  background: "#fff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "60px",
  fontFamily: "var(--font-body)",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "var(--color-burgundy)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "0.55rem 1.15rem",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "0.55rem 1.15rem",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};

const destructiveButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#a04020",
  border: "1px solid #d9b6a8",
  borderRadius: "8px",
  padding: "0.55rem 1.15rem",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};
