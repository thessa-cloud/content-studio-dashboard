/**
 * Prompt builders.
 *
 * Every empty-state, every Strategy/Drafts/Performance row that asks the user
 * to "run Claude on this" calls a builder from this file. A builder:
 *
 *   1. Fetches the freshest data the prompt needs (vault posts, strategy,
 *      performance snapshot).
 *   2. Composes the full prompt body (system instructions + framework +
 *      output format).
 *   3. Splices the fetched data into a fenced ```DATA``` block.
 *
 * The customer never sees this code. They click a button. We hand them a
 * single text blob to paste into claude.ai.
 *
 * NOTE: Phase 1 ships with placeholder prompt bodies. Phase 2 replaces every
 * `BODY_*` constant with the full 2-3 page "fat" prompt that has the
 * frameworks (viral hooks, buyer psychology, 2-second yes, tone of voice…)
 * baked in. The structure of the builders does not change between phases.
 */

import { fenceData } from "./fenceData";

type VaultPost = {
  id: string;
  source: "self" | "competitor" | string;
  handle: string;
  type: string;
  caption: string;
  hook?: string;
  pillar?: string;
  hook_type?: string;
  likes: number;
  comments: number;
  views?: number;
  url?: string;
  posted_at?: string;
};

type StrategyRow = {
  pillars?: unknown[];
  voice?: unknown;
  hooks?: unknown[];
  campaigns?: unknown[];
  ica_notes?: string | null;
};

async function fetchVault(): Promise<{ posts: VaultPost[]; scraped_at: string | null }> {
  try {
    const r = await fetch("/api/data?tab=vault", { cache: "no-store" });
    const j = await r.json();
    return j?.data ?? { posts: [], scraped_at: null };
  } catch {
    return { posts: [], scraped_at: null };
  }
}

async function fetchStrategy(): Promise<StrategyRow | null> {
  try {
    const r = await fetch("/api/data?tab=strategy", { cache: "no-store" });
    const j = await r.json();
    return j?.data ?? null;
  } catch {
    return null;
  }
}

async function fetchPerformance(): Promise<unknown> {
  try {
    const r = await fetch("/api/data?tab=performance", { cache: "no-store" });
    const j = await r.json();
    return j?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Pick the top-N rows by engagement for the user's own posts.
 * Engagement = likes + 4 * comments. Cheap-and-effective proxy.
 */
function topSelf(posts: VaultPost[], n = 30): VaultPost[] {
  return posts
    .filter((p) => p.source === "self")
    .sort((a, b) => (b.likes + 4 * b.comments) - (a.likes + 4 * a.comments))
    .slice(0, n)
    .map((p) => ({
      ...p,
      caption: (p.caption ?? "").slice(0, 1200),  // trim mega-captions
    }));
}

function competitorPosts(posts: VaultPost[]): VaultPost[] {
  return posts.filter((p) => p.source !== "self").slice(0, 50);
}

/* ─────────────────────────────────────────────────────────────────────
 * Prompt bodies. Placeholders in Phase 1; replaced with fat prompts
 * containing baked-in frameworks in Phase 2.
 * ───────────────────────────────────────────────────────────────────── */

const BODY_PILLARS = `You are a content strategist. From the DATA below (latest captions of one creator), extract 3-5 content pillars.

A pillar is a recurring topic territory the creator owns. It has:
- a short name (1-2 words)
- a one-sentence description in the creator's voice
- a colour (any hex)
- an approximate share of recent output (0..1)

Return JSON only, matching this schema:

\`\`\`json
[
  { "name": "Mindset", "description": "...", "color": "#741616", "share": 0.32 }
]
\`\`\``;

const BODY_VOICE = `You are a voice coach. From the DATA below (top 20 captions of one creator, sorted by engagement), extract their voice rules.

Output 1 short tone phrase + 4-8 do/don't rules + signature phrases they reuse + forbidden words/patterns they never use.

Return JSON only, matching:

\`\`\`json
{
  "tone": "warm, declarative, direct",
  "rules": ["Opens with a claim, never a question", "..."],
  "signature_phrases": ["..."],
  "forbidden": ["em dash", "..."]
}
\`\`\``;

const BODY_HOOKS = `You are a viral-hook analyst. From the DATA below (top posts of the creator + competitors), pull the 10 best-performing hooks (the first line, the thing that stops the scroll).

For each hook, classify the hook type (curiosity, contrarian, promise, numbered list, story open, callout, …).

Return JSON only, matching:

\`\`\`json
[
  { "text": "...", "type": "contrarian", "source": "mine", "note": "..." }
]
\`\`\``;

const BODY_COMPETITORS = `You are a competitive analyst. From the DATA below (competitor posts), surface their top performing patterns: best hook types, best formats (reel/carousel/image), recurring topics, posting cadence.

Return one section per competitor handle in this format:

\`\`\`
@handle
  best hook types: ...
  best formats: ...
  recurring topics: ...
  trending hooks (verbatim): ...
\`\`\``;

const BODY_DRAFT_CAPTION = (topic: string) => `You are a caption writer trained on the creator's voice (see VOICE DATA below) and their winning hook patterns (see HOOK DATA below).

Topic: ${topic || "(no topic provided — propose one from a winning pillar)"}

Write 3 caption options:
- Hook (first line, scroll-stopper, in their voice)
- Body (the rest of the caption, 3-6 short paragraphs)
- CTA (one specific action, never "link in bio")
- Format suggestion (carousel slide count, or reel beats, or single image)

Return Markdown with three numbered options.`;

/* ─────────────────────────────────────────────────────────────────────
 * Builders. Each returns a single string ready to paste into Claude.
 * ───────────────────────────────────────────────────────────────────── */

export async function buildPillarsPrompt(): Promise<string> {
  const { posts, scraped_at } = await fetchVault();
  const recent = topSelf(posts, 30);
  return [
    "# Extract content pillars",
    BODY_PILLARS,
    fenceData("DATA (recent captions, JSON)", { posts: recent, scraped_at }),
    "Return only the JSON pillars array. Nothing else.",
  ].join("\n\n");
}

export async function buildVoicePrompt(): Promise<string> {
  const { posts, scraped_at } = await fetchVault();
  const top = topSelf(posts, 20);
  return [
    "# Extract voice rules",
    BODY_VOICE,
    fenceData("DATA (top captions by engagement)", { posts: top, scraped_at }),
    "Return only the JSON voice object. Nothing else.",
  ].join("\n\n");
}

export async function buildHooksPrompt(): Promise<string> {
  const { posts, scraped_at } = await fetchVault();
  const mine = topSelf(posts, 20).map((p) => ({ ...p, source: "self" }));
  const comps = competitorPosts(posts).slice(0, 30);
  return [
    "# Extract hook library",
    BODY_HOOKS,
    fenceData("DATA (mine + competitors)", { mine, competitors: comps, scraped_at }),
    "Return only the JSON hooks array. Nothing else.",
  ].join("\n\n");
}

export async function buildCompetitorPrompt(): Promise<string> {
  const { posts, scraped_at } = await fetchVault();
  const comps = competitorPosts(posts);
  return [
    "# Competitor patterns",
    BODY_COMPETITORS,
    fenceData("DATA (competitor posts)", { posts: comps, scraped_at }),
  ].join("\n\n");
}

export async function buildDraftCaptionPrompt(topic = ""): Promise<string> {
  const [{ posts }, strategy, perf] = await Promise.all([
    fetchVault(),
    fetchStrategy(),
    fetchPerformance(),
  ]);
  const top = topSelf(posts, 15);
  return [
    "# Draft a caption in my voice",
    BODY_DRAFT_CAPTION(topic),
    fenceData("VOICE DATA (my rules)", strategy),
    fenceData("HOOK DATA (my winners)", { winners: top }),
    fenceData("PERFORMANCE SNAPSHOT", perf),
    "Return 3 captions in Markdown.",
  ].join("\n\n");
}
