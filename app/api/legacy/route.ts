import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Legacy Vault API.
 *
 *   GET    /api/legacy                       → all legacy_pieces, newest first
 *   POST   /api/legacy   { source_type, … }  → mark a library_post / draft / standalone as legacy
 *   PATCH  /api/legacy   { id, … }           → edit recycle config or standalone fields
 *   DELETE /api/legacy?id=…                  → unmark (remove legacy row; source is untouched)
 *
 * Auth: server-side service-role key only (same pattern as /api/data).
 *
 * Schema in supabase/migrations/0003_legacy_pieces.sql. Edge Function that
 * scans active pieces and clones them into drafts lives in
 * supabase/functions/legacy-recycle/ and is triggered manually via
 * /api/legacy/scan.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const ALLOWED_SOURCE_TYPES = ["library_post", "draft", "standalone"] as const;
const ALLOWED_TYPES = ["reel", "carousel", "story", "image"] as const;
const ALLOWED_RECYCLE_STATUS = ["paused", "active"] as const;

type SourceType = (typeof ALLOWED_SOURCE_TYPES)[number];
type LegacyType = (typeof ALLOWED_TYPES)[number];
type RecycleStatus = (typeof ALLOWED_RECYCLE_STATUS)[number];

const isSourceType = (v: unknown): v is SourceType =>
  typeof v === "string" && (ALLOWED_SOURCE_TYPES as readonly string[]).includes(v);
const isLegacyType = (v: unknown): v is LegacyType =>
  typeof v === "string" && (ALLOWED_TYPES as readonly string[]).includes(v);
const isRecycleStatus = (v: unknown): v is RecycleStatus =>
  typeof v === "string" && (ALLOWED_RECYCLE_STATUS as readonly string[]).includes(v);

// Caps so a tampered request can't land megabytes into a jsonb-adjacent text
// column. Same defense-in-depth principle as /api/data POST tab=performance.
const cap = (s: unknown, n: number) =>
  typeof s === "string" ? s.slice(0, n) : null;

const clampInterval = (n: unknown): number => {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return 28;
  // 7 days minimum (cool-off so a runaway scan can't refire next day) and
  // 365 days maximum (anything longer is a "remind me yearly" use case that
  // belongs in a different system).
  return Math.max(7, Math.min(365, Math.round(num)));
};

/**
 * Parse-and-normalise a posted_at string. We were previously gating on
 * `typeof === "string" && length > 0 && length < 40` which let through
 * unparseable but short strings ("not-a-date") that then hit the
 * timestamptz column and tripped a Postgres-side 500. Now we round-trip
 * through Date so anything Postgres can't parse fails fast in JS with a
 * friendly 400. Returns the canonical ISO string on success, null on
 * empty input, undefined on bad input (caller decides how to react).
 */
const parsePostedAt = (v: unknown): string | null | undefined => {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 40) return undefined;
  const ts = Date.parse(trimmed);
  if (!Number.isFinite(ts)) return undefined;
  return new Date(ts).toISOString();
};

export async function GET() {
  if (!supabase) return NextResponse.json({ data: [] });
  try {
    const { data, error } = await supabase
      .from("legacy_pieces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ data: [], warning: error.message });
    return NextResponse.json({ data: data ?? [] });
  } catch (e) {
    return NextResponse.json({ data: [], warning: (e as Error).message });
  }
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (!isSourceType(body.source_type)) {
    return NextResponse.json({ error: "Invalid source_type" }, { status: 400 });
  }
  if (!isLegacyType(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const sourceType = body.source_type;
  const sourceId =
    sourceType === "standalone"
      ? null
      : typeof body.source_id === "string" && body.source_id.length > 0
        ? body.source_id
        : null;

  if (sourceType !== "standalone" && !sourceId) {
    return NextResponse.json(
      { error: "source_id is required when source_type is library_post or draft" },
      { status: 400 }
    );
  }

  // Prevent duplicate-legacy on the same source (one legacy row per source).
  if (sourceId) {
    const { data: existing } = await supabase
      .from("legacy_pieces")
      .select("id")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Source is already marked as legacy", existing_id: existing.id },
        { status: 409 }
      );
    }
  }

  // posted_at goes through Date.parse so an unparseable-but-short string
  // can't trip Postgres on the insert. undefined here = bad input → 400.
  const parsedPostedAt =
    body.posted_at === undefined ? null : parsePostedAt(body.posted_at);
  if (parsedPostedAt === undefined) {
    return NextResponse.json({ error: "Invalid posted_at" }, { status: 400 });
  }

  // Snapshot fields. For library_post / draft sources we accept hook/caption
  // from the request (the client reads them off the source row before sending)
  // — this denormalization keeps the legacy row useful even if the source is
  // deleted or re-scraped away later.
  const row = {
    source_type: sourceType,
    source_id: sourceId,
    type: body.type,
    hook: cap(body.hook, 500),
    caption: cap(body.caption, 4000),
    posted_at: parsedPostedAt,
    thumb_url: cap(body.thumb_url, 1000),
    performance_note: cap(body.performance_note, 500),
    recycle_status: isRecycleStatus(body.recycle_status) ? body.recycle_status : "paused",
    recycle_interval_days: clampInterval(body.recycle_interval_days ?? 28),
  };

  // Standalone requires at least hook OR caption — otherwise the row is
  // useless when recycled. References (library_post / draft) can have empty
  // hook because the source still exists.
  if (sourceType === "standalone" && !row.hook && !row.caption) {
    return NextResponse.json(
      { error: "Standalone legacy needs at least hook or caption" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("legacy_pieces")
    .insert([row])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Whitelist the fields a PATCH can change. Source identity (source_type /
  // source_id) cannot be moved after creation — that would mutate what the
  // row even represents.
  const updates: Record<string, unknown> = {};

  if (body.recycle_status !== undefined) {
    if (!isRecycleStatus(body.recycle_status)) {
      return NextResponse.json({ error: "Invalid recycle_status" }, { status: 400 });
    }
    updates.recycle_status = body.recycle_status;
  }

  if (body.recycle_interval_days !== undefined) {
    updates.recycle_interval_days = clampInterval(body.recycle_interval_days);
  }

  if (body.performance_note !== undefined) {
    updates.performance_note = body.performance_note === null ? null : cap(body.performance_note, 500);
  }

  // Standalone-only edits — server doesn't enforce "only when standalone"
  // because changing the hook/caption snapshot on a referenced legacy is
  // sometimes useful (user wants a tighter hook for the recycled draft than
  // the original carried). Keep it permissive; the UI only surfaces these
  // fields for standalone rows.
  if (body.hook !== undefined) updates.hook = body.hook === null ? null : cap(body.hook, 500);
  if (body.caption !== undefined) updates.caption = body.caption === null ? null : cap(body.caption, 4000);
  if (body.posted_at !== undefined) {
    const parsed = parsePostedAt(body.posted_at);
    if (parsed === undefined) {
      return NextResponse.json({ error: "Invalid posted_at" }, { status: 400 });
    }
    updates.posted_at = parsed;
  }
  if (body.thumb_url !== undefined) updates.thumb_url = body.thumb_url === null ? null : cap(body.thumb_url, 1000);
  if (body.type !== undefined) {
    if (!isLegacyType(body.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    updates.type = body.type;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("legacy_pieces")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("legacy_pieces").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
