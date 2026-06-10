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
} from "../../../lib/legacy";

/**
 * Standalone-legacy modal — for stories (and other content) that Apify can't
 * scrape, so there's no library_post / draft to point at. Captures everything
 * the recycle scan needs: type, hook, caption, posted_at, performance_note +
 * recycle config.
 *
 * Triggered from Vault's "Add a legacy story" header button (because stories
 * that escape Apify almost always land in the same place — Thessa typing the
 * winner she just posted into her own dashboard the next morning).
 *
 * Edit-mode reuses the same surface for an already-marked standalone row
 * (lets her tidy up the caption, swap thumb_url, or unmark).
 */

const TYPE_OPTIONS: LegacyType[] = ["story", "reel", "carousel", "image"];

export type StandaloneLegacyModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  // If editing an already-marked standalone row, pre-fill from it.
  existing?: LegacyPiece | null;
};

export default function StandaloneLegacyModal({
  open,
  onClose,
  onSaved,
  existing = null,
}: StandaloneLegacyModalProps) {
  const isEdit = existing !== null;

  const [type, setType] = useState<LegacyType>("story");
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [postedAt, setPostedAt] = useState(""); // YYYY-MM-DD (date input)
  const [thumbUrl, setThumbUrl] = useState("");
  const [performanceNote, setPerformanceNote] = useState("");
  const [recycleStatus, setRecycleStatus] = useState<LegacyRecycleStatus>("paused");
  const [intervalDays, setIntervalDays] = useState(DEFAULT_RECYCLE_INTERVAL_DAYS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setType(existing.type);
      setHook(existing.hook ?? "");
      setCaption(existing.caption ?? "");
      setPostedAt(existing.posted_at ? existing.posted_at.slice(0, 10) : "");
      setThumbUrl(existing.thumb_url ?? "");
      setPerformanceNote(existing.performance_note ?? "");
      setRecycleStatus(existing.recycle_status);
      setIntervalDays(existing.recycle_interval_days);
    } else {
      setType("story");
      setHook("");
      setCaption("");
      setPostedAt(new Date().toISOString().slice(0, 10));
      setThumbUrl("");
      setPerformanceNote("");
      setRecycleStatus("paused");
      setIntervalDays(DEFAULT_RECYCLE_INTERVAL_DAYS);
    }
    setError(null);
  }, [open, existing]);

  if (!open) return null;

  // Server enforces this too; we mirror it here so the disabled-button gives
  // an obvious reason long before the request fires.
  const canSave = hook.trim().length > 0 || caption.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Date input gives us YYYY-MM-DD; we pad to midnight UTC so the
      // timestamptz column stores a deterministic instant rather than
      // whatever the browser's local-midnight is. The legacy spec records
      // posted_at as "the day this went up", not a precise wall clock.
      const postedAtIso = postedAt ? `${postedAt}T00:00:00.000Z` : undefined;

      if (isEdit && existing) {
        const updated = await updateLegacy({
          id: existing.id,
          type,
          hook: hook.trim() || null,
          caption: caption.trim() || null,
          posted_at: postedAtIso ?? null,
          thumb_url: thumbUrl.trim() || null,
          performance_note: performanceNote.trim() || null,
          recycle_status: recycleStatus,
          recycle_interval_days: intervalDays,
        });
        if (!updated) throw new Error("Update failed");
      } else {
        const created = await markAsLegacy({
          source_type: "standalone",
          type,
          hook: hook.trim() || undefined,
          caption: caption.trim() || undefined,
          posted_at: postedAtIso,
          thumb_url: thumbUrl.trim() || undefined,
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
    if (!confirm("Unmark this standalone legacy? The row is deleted — there's no source to fall back to.")) return;
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
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "560px",
          padding: "1.6rem",
          boxShadow: "var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.18))",
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
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
              {isEdit ? "Edit standalone legacy" : "Add a legacy story"}
            </h3>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--color-text-dim)" }}>
              {isEdit
                ? "Tidy up the snapshot or adjust recycle config."
                : "For winners Apify can't scrape (stories, manual posts). Fill in what you need to recycle later."}
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
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Field label="Type" hint="Story is the default — that's what Apify misses." style={{ flex: "1 1 140px" }}>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LegacyType)}
                style={inputStyle}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Posted on" hint="The day this went up." style={{ flex: "1 1 160px" }}>
              <input
                type="date"
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Hook" hint="First line / opening visual line that stopped the scroll.">
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              maxLength={500}
              placeholder="The thing that made it work"
              style={inputStyle}
            />
          </Field>

          <Field label="Caption / body">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="The full text. For stories, what was on screen + voiceover beats."
              style={textareaStyle}
            />
          </Field>

          <Field label="Thumb URL (optional)" hint="Direct link to a screenshot of the winner — handy when reviewing the recycled draft later.">
            <input
              type="url"
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
              maxLength={1000}
              placeholder="https://..."
              style={inputStyle}
            />
          </Field>

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

          {!canSave && (
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", margin: 0 }}>
              Fill in at least a hook or a caption — otherwise the row can&apos;t be recycled later.
            </p>
          )}

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
              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                style={{ ...primaryButtonStyle, opacity: saving || !canSave ? 0.6 : 1 }}
              >
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add to vault"}
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
  style,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", ...style }}>
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
  width: "100%",
  boxSizing: "border-box",
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
