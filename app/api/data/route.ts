import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Single read/write API for every tab in the dashboard.
 *
 *   GET    /api/data?tab=performance           → latest stats snapshot
 *   GET    /api/data?tab=strategy              → pillars + voice + campaigns
 *   GET    /api/data?tab=drafts                → all drafts (newest first)
 *   GET    /api/data?tab=intel&handle=foo      → latest snapshot for one handle
 *   GET    /api/data?tab=vault                 → raw scrape feed (posts)
 *   GET    /api/data?tab=settings              → brand / competitors / triggers
 *   GET    /api/data?tab=scrape-meta           → most recent scraped_at
 *
 *   POST   /api/data?tab=drafts                → create draft
 *   PUT    /api/data?tab=settings              → upsert singleton settings
 *   PATCH  /api/data?tab=drafts                → update draft (body: { id, ...fields })
 *   DELETE /api/data?tab=drafts&id=…           → delete draft
 *
 * Schema lives in milestone-5 (Supabase migration). Until the tables exist,
 * every GET returns a sentinel ({ data: null } or { data: [] }) so the
 * frontend renders its empty-state UI cleanly on a fresh deploy.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

function notReady(extra: Record<string, unknown> = {}) {
  // Supabase env not set yet (fresh Vercel deploy, before user pastes creds).
  return NextResponse.json({ data: null, ...extra });
}

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab");
  if (!supabase) return notReady();

  try {
    if (tab === "performance") {
      const { data } = await supabase
        .from("performance")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ data: data ?? null });
    }

    if (tab === "strategy") {
      const { data } = await supabase
        .from("strategy")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return NextResponse.json({ data: null });
      // Normalize: the DB stores `voice` as a jsonb object
      // { tone, rules, signature_phrases, forbidden }. The UI also expects
      // top-level `voice_rules` for back-compat with /prompts/2-extract-voice.md
      // output and the config.json fallback. Surface both shapes.
      const voice = (data.voice ?? {}) as {
        tone?: string;
        rules?: string[];
        signature_phrases?: string[];
        forbidden?: string[];
      };
      return NextResponse.json({
        data: {
          ...data,
          // `hooks` is an optional jsonb column. Older installs that haven't
          // run the additive ALTER yet return undefined; surface an empty
          // array so the UI never has to nil-check.
          hooks: Array.isArray(data.hooks) ? data.hooks : [],
          voice_rules: Array.isArray(voice.rules) ? voice.rules : [],
          voice_tone: typeof voice.tone === "string" ? voice.tone : null,
          voice_signature_phrases: Array.isArray(voice.signature_phrases)
            ? voice.signature_phrases
            : [],
          voice_forbidden: Array.isArray(voice.forbidden) ? voice.forbidden : [],
        },
      });
    }

    if (tab === "drafts") {
      const { data } = await supabase
        .from("drafts")
        .select("*")
        .order("created_at", { ascending: false });
      return NextResponse.json({ data: data ?? [] });
    }

    if (tab === "intel") {
      const handle = req.nextUrl.searchParams.get("handle");
      if (!handle) return NextResponse.json({ data: null });
      const cleaned = handle.replace(/^@/, "");
      const { data } = await supabase
        .from("competitors")
        .select("*")
        .eq("handle", cleaned)
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ data: data ?? null });
    }

    if (tab === "vault") {
      const { data } = await supabase
        .from("library_posts")
        .select("*")
        .order("posted_at", { ascending: false })
        .limit(500);

      const { data: meta } = await supabase
        .from("scrape_log")
        .select("scraped_at")
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        data: {
          posts: data ?? [],
          scraped_at: meta?.scraped_at ?? null,
        },
      });
    }

    if (tab === "settings") {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("singleton", true)
        .maybeSingle();
      return NextResponse.json({ data: data ?? null });
    }

    if (tab === "scrape-meta") {
      const { data } = await supabase
        .from("scrape_log")
        .select("scraped_at")
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ data: data ?? null });
    }

    return NextResponse.json({ error: "Unknown tab" }, { status: 400 });
  } catch (e) {
    // Tables not yet created (first boot before migration). Treat as empty.
    return NextResponse.json({ data: null, warning: (e as Error).message });
  }
}

export async function POST(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab");
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  if (tab === "drafts") {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body.caption) {
      return NextResponse.json({ error: "Missing caption" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("drafts")
      .insert([{ ...body, status: body.status ?? "draft" }])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (tab === "strategy") {
    // Initial strategy row. Used by the UI when the table is empty (first time
    // the user opens the Edit form on a fresh deploy). Subsequent edits go
    // through PATCH so we keep a single rolling row instead of one per save.
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const isPlainObject = (v: unknown): v is Record<string, unknown> =>
      v !== null && typeof v === "object" && !Array.isArray(v);
    const { data, error } = await supabase
      .from("strategy")
      .insert([
        {
          pillars: Array.isArray(body.pillars) ? body.pillars : [],
          voice: isPlainObject(body.voice) ? body.voice : {},
          campaigns: Array.isArray(body.campaigns) ? body.campaigns : [],
          hooks: Array.isArray(body.hooks) ? body.hooks : [],
          ica_notes: typeof body.ica_notes === "string" ? body.ica_notes : null,
        },
      ])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "POST not supported for this tab" }, { status: 405 });
}

// Whitelist of tabs that may be mutated through PATCH/DELETE. Read-only
// tabs (performance, vault, competitors, scrape_log) are written exclusively
// by the Apify Edge Function, never by the dashboard. Without this whitelist
// the `tab` query param would let a caller target any table via the service
// role key.
const WRITABLE_TABS = ["drafts", "strategy"] as const;
type WritableTab = (typeof WRITABLE_TABS)[number];
const isWritableTab = (t: string | null): t is WritableTab =>
  t !== null && (WRITABLE_TABS as readonly string[]).includes(t);

export async function PUT(req: NextRequest) {
  // Singleton upsert for settings. Customer Settings tab calls this on every
  // Save. We keep a single row identified by `singleton = true` (DB unique
  // constraint enforces this). First save inserts; subsequent saves update.
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const tab = req.nextUrl.searchParams.get("tab");
  if (tab !== "settings") {
    return NextResponse.json({ error: "PUT only supported for tab=settings" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Normalize/whitelist the fields we accept so a stray field cannot land in
  // the table. trigger_words must be an array of plain objects shaped like
  // { word, offer, topic, promise } — we shape-check each entry here so the
  // UI cannot accidentally send a string array (which is the OLD config.json
  // shape pre-triplet) and break the schema downstream.
  type TriggerTriplet = { word: string; offer: string; topic: string; promise: string };
  const normalizeTriggers = (raw: unknown): TriggerTriplet[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((t) => {
        if (typeof t === "string") {
          // Pre-triplet legacy shape — fill blanks so the row is still valid.
          return { word: t, offer: "", topic: "", promise: "" };
        }
        if (t && typeof t === "object") {
          const o = t as Record<string, unknown>;
          return {
            word: typeof o.word === "string" ? o.word : "",
            offer: typeof o.offer === "string" ? o.offer : "",
            topic: typeof o.topic === "string" ? o.topic : "",
            promise: typeof o.promise === "string" ? o.promise : "",
          };
        }
        return null;
      })
      .filter((t): t is TriggerTriplet => t !== null && t.word.trim().length > 0);
  };

  const competitors = Array.isArray(body.competitors)
    ? (body.competitors as unknown[])
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.replace(/^@/, "").trim())
        .slice(0, 5)
    : [];

  const payload = {
    singleton: true,
    // Trim before persist so a customer who fat-fingers a trailing space in
    // the Brand form doesn't see "REVENU " everywhere in the dashboard. An
    // empty string after trim collapses to null so the column is
    // unambiguously "not set" rather than "set to whitespace".
    brand_name:
      typeof body.brand_name === "string" ? body.brand_name.trim() || null : null,
    instagram_handle:
      typeof body.instagram_handle === "string"
        ? body.instagram_handle.replace(/^@/, "").trim() || null
        : null,
    competitors,
    trigger_words: normalizeTriggers(body.trigger_words),
  };

  const { data, error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "singleton" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { id?: string } & Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const tab = req.nextUrl.searchParams.get("tab") ?? "drafts";
  if (!isWritableTab(tab)) {
    return NextResponse.json({ error: "Tab not writable" }, { status: 400 });
  }
  const table: WritableTab = tab;

  // The drafts table has a touch_updated_at trigger; strategy does not.
  // Bump it here so the UI's "last edited" hint stays accurate.
  if (table === "strategy") {
    updates.updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const tab = req.nextUrl.searchParams.get("tab") ?? "drafts";
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (!isWritableTab(tab)) {
    return NextResponse.json({ error: "Tab not writable" }, { status: 400 });
  }
  const table: WritableTab = tab;

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
