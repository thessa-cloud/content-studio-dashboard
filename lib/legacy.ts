/**
 * Legacy Vault helpers.
 *
 * Mark winner content (reels, carousels, stories, images) as "legacy" so it
 * can be filtered separately and optionally auto-recycled into the drafts queue
 * via the legacy-recycle Edge Function (invoked manually from the dashboard,
 * not scheduled).
 *
 * Source-polymorphism: a legacy piece can point at a library_posts row, a
 * drafts row, or be standalone (manually entered story that Apify never
 * scraped). Denormalized hook/caption/posted_at on the legacy row means the
 * piece survives even if the source row is later deleted or re-scraped away.
 *
 * Schema lives in supabase/migrations/0003_legacy_pieces.sql.
 */

export type LegacySourceType = "library_post" | "draft" | "standalone";
export type LegacyType = "reel" | "carousel" | "story" | "image";
export type LegacyRecycleStatus = "paused" | "active";

export type LegacyPiece = {
  id: string;
  created_at: string;
  updated_at: string;
  source_type: LegacySourceType;
  source_id: string | null;
  type: LegacyType;
  hook: string | null;
  caption: string | null;
  posted_at: string | null;
  thumb_url: string | null;
  performance_note: string | null;
  recycle_status: LegacyRecycleStatus;
  recycle_interval_days: number;
  last_recycled_at: string | null;
  recycle_count: number;
};

/**
 * Shape the dashboard sends on POST /api/legacy to mark a piece. We accept
 * either a reference to an existing library_post / draft (preferred — keeps
 * everything joined up), or a fully-standalone payload for stories that
 * Apify can't reach.
 */
export type LegacyCreatePayload =
  | {
      source_type: "library_post" | "draft";
      source_id: string;
      type: LegacyType;
      hook?: string;
      caption?: string;
      posted_at?: string;
      thumb_url?: string;
      performance_note?: string;
      recycle_status?: LegacyRecycleStatus;
      recycle_interval_days?: number;
    }
  | {
      source_type: "standalone";
      type: LegacyType;
      hook?: string;
      caption?: string;
      posted_at?: string;
      thumb_url?: string;
      performance_note?: string;
      recycle_status?: LegacyRecycleStatus;
      recycle_interval_days?: number;
    };

export type LegacyUpdatePayload = {
  id: string;
  performance_note?: string | null;
  recycle_status?: LegacyRecycleStatus;
  recycle_interval_days?: number;
  // Standalone-only edits (the only source_type where these fields are not
  // owned by the upstream row).
  hook?: string | null;
  caption?: string | null;
  posted_at?: string | null;
  thumb_url?: string | null;
  type?: LegacyType;
};

export type LegacyScanResult = {
  scanned: number;       // pieces with recycle_status='active' that were eligible
  cloned: number;        // drafts actually inserted
  skipped: number;       // eligible but skipped (e.g. caption empty)
  ran_at: string;        // ISO timestamp the scan executed
};

/**
 * Default recycle interval. 4 weeks — Thessa's preferred cadence for monthly
 * winner-recycling. The user can override per-piece via the UI toggle.
 */
export const DEFAULT_RECYCLE_INTERVAL_DAYS = 28;

/**
 * Client-side helpers. The dashboard calls these from React components; they
 * speak to /api/legacy and /api/legacy/scan which both authenticate via the
 * service-role key server-side.
 */

export async function fetchLegacyPieces(): Promise<LegacyPiece[]> {
  const res = await fetch("/api/legacy", { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: LegacyPiece[] };
  return json.data ?? [];
}

export async function markAsLegacy(payload: LegacyCreatePayload): Promise<LegacyPiece | null> {
  const res = await fetch("/api/legacy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: LegacyPiece };
  return json.data ?? null;
}

export async function updateLegacy(payload: LegacyUpdatePayload): Promise<LegacyPiece | null> {
  const res = await fetch("/api/legacy", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: LegacyPiece };
  return json.data ?? null;
}

export async function unmarkLegacy(id: string): Promise<boolean> {
  const res = await fetch(`/api/legacy?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function triggerRecycleScan(): Promise<LegacyScanResult | null> {
  const res = await fetch("/api/legacy/scan", { method: "POST" });
  if (!res.ok) return null;
  const json = (await res.json()) as LegacyScanResult & { error?: string };
  if (json.error) return null;
  return json;
}

/**
 * Build a lookup map keyed by `${source_type}:${source_id}` so a UI rendering
 * a long list of library_posts / drafts can decide in O(1) whether each row
 * is already legacy-marked, and surface a ★ Legacy badge accordingly.
 *
 * Standalone legacies are not included because they have no source row to
 * decorate — they show up in their own Legacy filter only.
 */
export function buildLegacyIndex(pieces: LegacyPiece[]): Map<string, LegacyPiece> {
  const idx = new Map<string, LegacyPiece>();
  for (const p of pieces) {
    if (p.source_type === "standalone" || !p.source_id) continue;
    idx.set(`${p.source_type}:${p.source_id}`, p);
  }
  return idx;
}

export function legacyKey(source_type: LegacySourceType, source_id: string | null): string {
  return `${source_type}:${source_id ?? ""}`;
}
