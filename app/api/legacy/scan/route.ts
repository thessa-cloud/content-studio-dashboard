import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Legacy recycle scan.
 *
 *   POST /api/legacy/scan
 *     → scan legacy_pieces where recycle_status='active' AND interval elapsed,
 *       clone each eligible row into drafts (status='draft'), update
 *       last_recycled_at + recycle_count, log to scrape_log.
 *
 * Triggered manually from the dashboard ("Run recycle scan now" button in the
 * Drafts tab header). NOT scheduled — Thessa explicitly opted out of any cron
 * so the system never surprises her with drafts she didn't ask for.
 *
 * Design choice — inline vs Supabase Edge Function:
 *   With no scheduling involved, an Edge Function adds a deploy step + an HTTP
 *   hop without any scaling or isolation benefit. Same supabase-js client
 *   here in Node.js does the work in one round-trip per piece. If a future
 *   release adds pg_cron scheduling, lift this handler verbatim into
 *   supabase/functions/legacy-recycle/index.ts (the queries are
 *   transport-agnostic).
 *
 * Cloned-draft notes format: "♻ Recycled from legacy #{8-hex} — originally
 * posted {YYYY-MM-DD}\nPerformance: {note}". The UI looks for the ♻ prefix
 * to surface a "Recycled" badge on the DraftCard.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

type LegacyRow = {
  id: string;
  source_type: "library_post" | "draft" | "standalone";
  source_id: string | null;
  type: "reel" | "carousel" | "story" | "image";
  hook: string | null;
  caption: string | null;
  posted_at: string | null;
  performance_note: string | null;
  recycle_status: "paused" | "active";
  recycle_interval_days: number;
  last_recycled_at: string | null;
  recycle_count: number;
};

type DraftSourceRow = {
  pillar?: string | null;
  hook_type?: string | null;
  trigger_word?: string | null;
};

type LibrarySourceRow = {
  pillar?: string | null;
  hook_type?: string | null;
};

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const ranAt = new Date().toISOString();
  const now = Date.now();

  // 1. Pull all active legacy pieces. We filter the interval check in JS so
  //    we can use the rich `make_interval` semantics consistently with how
  //    we'd build it in SQL later.
  const { data: activePieces, error: listErr } = await supabase
    .from("legacy_pieces")
    .select("*")
    .eq("recycle_status", "active");

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  const pieces = (activePieces ?? []) as LegacyRow[];

  // Eligible = never recycled OR (now - last_recycled_at) >= interval_days
  const eligible = pieces.filter((p) => {
    if (!p.last_recycled_at) return true;
    const last = Date.parse(p.last_recycled_at);
    if (!Number.isFinite(last)) return true;
    const elapsedMs = now - last;
    const intervalMs = p.recycle_interval_days * 24 * 60 * 60 * 1000;
    return elapsedMs >= intervalMs;
  });

  let cloned = 0;
  let skipped = 0;

  for (const piece of eligible) {
    // Must have at least a caption to clone — an empty draft is unusable.
    // Standalone pieces with no caption fall here too (the POST endpoint
    // rejects them on create, but a referenced piece whose source has since
    // lost its caption would land here).
    if (!piece.caption || piece.caption.trim().length === 0) {
      skipped += 1;
      continue;
    }

    // 2a. Atomic claim — stamp last_recycled_at + bump recycle_count BEFORE
    //     cloning, conditional on the row's last_recycled_at still matching
    //     what we read in step 1. If a concurrent scan beat us to it (the
    //     row's last_recycled_at has moved), the conditional UPDATE returns
    //     0 rows and we skip cloning for this piece. This prevents the
    //     double-clone race when "Run recycle scan" is double-clicked.
    //
    //     Failure mode trade: clone might fail after the claim (network /
    //     drafts insert error), and we lose a recycle for this cycle. Next
    //     scan re-evaluates eligibility based on the just-stamped
    //     last_recycled_at and waits the full interval. Same trade-off the
    //     code-comments below already document, just reversed in order:
    //     "lost recycle" is preferable to "double-cloned draft" for Thessa
    //     (an extra draft in her queue is a surprise; a missed one she'll
    //     fix on the next scan).
    let claimQuery = supabase
      .from("legacy_pieces")
      .update({
        last_recycled_at: ranAt,
        recycle_count: piece.recycle_count + 1,
      })
      .eq("id", piece.id)
      .eq("recycle_count", piece.recycle_count);

    claimQuery =
      piece.last_recycled_at === null
        ? claimQuery.is("last_recycled_at", null)
        : claimQuery.eq("last_recycled_at", piece.last_recycled_at);

    const { data: claimed, error: claimErr } = await claimQuery.select();

    if (claimErr || !claimed || claimed.length === 0) {
      // Another scan ran got here first. Skip without cloning.
      skipped += 1;
      continue;
    }

    // 2b. Pull the source row (if any) for inheritable fields. Per Thessa's
    //    answer: trigger_word INHERITS from the original (so the recycled
    //    draft carries the same campaign linkage and she can swap it during
    //    review if the campaign has changed).
    let pillar: string | null = null;
    let hookType: string | null = null;
    let triggerWord: string | null = null;

    if (piece.source_type === "draft" && piece.source_id) {
      const { data: src } = await supabase
        .from("drafts")
        .select("pillar, hook_type, trigger_word")
        .eq("id", piece.source_id)
        .maybeSingle<DraftSourceRow>();
      if (src) {
        pillar = src.pillar ?? null;
        hookType = src.hook_type ?? null;
        triggerWord = src.trigger_word ?? null;
      }
    } else if (piece.source_type === "library_post" && piece.source_id) {
      const { data: src } = await supabase
        .from("library_posts")
        .select("pillar, hook_type")
        .eq("id", piece.source_id)
        .maybeSingle<LibrarySourceRow>();
      if (src) {
        pillar = src.pillar ?? null;
        hookType = src.hook_type ?? null;
      }
      // library_posts has no trigger_word — leave null. Thessa picks one at review.
    }
    // standalone: no source, all fields stay null.

    // 3. Compose notes — UI greps for "♻ Recycled" prefix to draw the badge.
    const shortId = piece.id.replace(/-/g, "").slice(0, 8);
    const datePart = piece.posted_at
      ? new Date(piece.posted_at).toISOString().slice(0, 10)
      : "unknown date";
    const perfLine = piece.performance_note?.trim()
      ? `\nPerformance: ${piece.performance_note.trim()}`
      : "";
    const notes = `♻ Recycled from legacy #${shortId} — originally posted ${datePart}${perfLine}`;

    // 4. Insert the draft. The drafts schema uses `format` for the type column
    //    (DB-side); UI uses `type`. We write `format` to match the DB; the
    //    /api/data?tab=drafts read path returns the row as-is and Drafts.tsx
    //    surfaces format via the Draft type. Keep both for compatibility.
    const draftRow: Record<string, unknown> = {
      caption: piece.caption,
      status: "draft",
      format: piece.type,
      hook_type: hookType,
      trigger_word: triggerWord,
      pillar,
      notes,
    };

    const { error: insertErr } = await supabase.from("drafts").insert([draftRow]);
    if (insertErr) {
      // We already claimed the piece in step 2a (stamped last_recycled_at +
      // bumped recycle_count). The draft insert failed; the claim sticks.
      // Result: this cycle is lost, next scan waits the full interval again.
      // Trade-off: better than a transaction rollback that releases the
      // claim and risks double-clone on rapid retry.
      skipped += 1;
      continue;
    }

    cloned += 1;
  }

  // 6. Log to scrape_log so the run shows up in the audit stream the Settings
  //    tab already surfaces. Mode='legacy-recycle' keeps it filterable.
  await supabase.from("scrape_log").insert([
    {
      scraped_at: ranAt,
      mode: "legacy-recycle",
      status: cloned > 0 ? "success" : "success",
      notes: `Scanned ${pieces.length} active, ${eligible.length} eligible, cloned ${cloned}, skipped ${skipped}`,
    },
  ]);

  return NextResponse.json({
    scanned: eligible.length,
    cloned,
    skipped,
    ran_at: ranAt,
  });
}
