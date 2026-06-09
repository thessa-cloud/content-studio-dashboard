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

/**
 * Tagged error a builder throws when the vault has no posts. The
 * CopyPromptButton checks the message prefix to render a friendly state
 * ("Vault is empty — scrape your handle first") instead of the generic
 * "Could not copy. Try again". We keep this as a plain Error with a
 * recognizable prefix so the boundary stays a string contract — no need
 * to share a class across the client/server graph.
 */
export const EMPTY_VAULT_PREFIX = "EMPTY_VAULT:";

async function fetchVault(): Promise<{ posts: VaultPost[]; scraped_at: string | null }> {
  let data: { posts: VaultPost[]; scraped_at: string | null };
  try {
    const r = await fetch("/api/data?tab=vault", { cache: "no-store" });
    const j = await r.json();
    data = j?.data ?? { posts: [], scraped_at: null };
  } catch {
    data = { posts: [], scraped_at: null };
  }
  if (!data.posts || data.posts.length === 0) {
    throw new Error(
      `${EMPTY_VAULT_PREFIX} Vault is empty. Open the Vault tab and scrape your handle first.`
    );
  }
  return data;
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
      caption: trimCaption(p.caption ?? ""),
    }));
}

/**
 * Trim a caption to ~1200 chars and add a visible "[…trimmed]" marker.
 *
 * Why mark it: without the marker, Claude can't tell the difference between
 * a creator who writes 90-word captions and one who writes 900-word captions
 * — both end at 1200 chars in our prompt. The marker tells Claude "there
 * was more here, you're not seeing the whole thing" so it doesn't infer
 * fake patterns from a clean cut.
 */
function trimCaption(caption: string): string {
  if (caption.length <= 1200) return caption;
  return caption.slice(0, 1200).trimEnd() + " […trimmed]";
}

function competitorPosts(posts: VaultPost[]): VaultPost[] {
  return posts.filter((p) => p.source !== "self").slice(0, 50);
}

/* ─────────────────────────────────────────────────────────────────────
 * Prompt bodies.
 *
 * These are the "fat" framework-baked versions. Each body teaches Claude
 * exactly what the framework is, what good output looks like, and what
 * common-AI-slop patterns to avoid. The customer pastes the whole thing
 * into claude.ai; the embedded DATA block gives Claude their real posts
 * to work from. The output schema is strict so the answer can be pasted
 * straight back into the dashboard.
 *
 * Generic on purpose — these run for any niche, not just one brand.
 * ───────────────────────────────────────────────────────────────────── */

const BODY_PILLARS = `You are a senior content strategist. From the DATA below (a creator's recent Instagram posts), extract 3 to 5 content pillars that genuinely describe what they post about.

## What a pillar is

A pillar is a recurring topic territory the creator visibly owns. Not a category, not a "vibe" — a specific subject they keep returning to with their own angle.

Test for a real pillar:
1. Can you point to 4+ posts that clearly belong to it?
2. Could a stranger guess what kind of post comes next?
3. Does the name sound like something the creator would actually say (not a brand-deck buzzword)?

## How to find them

- Read every caption end-to-end. Note the actual subject, not just the hook.
- Group by subject, not by format. A reel and a carousel about the same thing belong together.
- Merge any two groups that overlap by more than ~60%.
- If you end up with 6+ pillars, you over-split. Collapse the weakest into the others.
- If you end up with 1-2, you under-grouped. Look harder for distinct angles.

## Output rules

- name: 1 to 3 words. Plain English. The creator's own framing if you can spot it.
- description: ONE sentence. Specific. What this pillar covers + what makes the creator's take on it different.
- color: hex. Pick warm, readable tones. Use distinct hues across pillars.
- share: 0..1, sums to roughly 1.0 across all pillars.

## Forbidden

- Generic marketing words: "lifestyle content", "value-driven posts", "educational content", "inspirational posts", "empowerment", "authentic", "raw".
- Buzzword pillars that fit any creator: "Mindset", "Motivation", "Tips" — only allowed if the description proves the creator's specific spin.
- Em dashes. Use commas.

## Output

Return JSON only. No prose before or after. Match this schema exactly:

\`\`\`json
[
  { "name": "Passive income", "description": "...", "color": "#741616", "share": 0.32 }
]
\`\`\``;

const BODY_VOICE = `You are a senior voice coach. From the DATA below (the creator's top-performing captions by engagement), extract the rules of their voice so any caption written using these rules sounds like them.

## What you are looking for

Voice = the patterns a reader would recognize as "this person" even with the handle removed. It shows up in:

- Sentence shape (long flowing vs short staccato; statements vs questions)
- Word choices they keep reusing (signature words, signature openers, signature closers)
- What they NEVER say (forbidden words, patterns, tones)
- The emotional register (warm vs cool, claiming vs hedging, certain vs exploratory)
- How they open (do they hook with a claim, a question, a confession, a callout?)
- How they close (CTA shape, sign-off, last line punch)

## Method

1. Read all captions. Underline every repeated pattern.
2. Distill to: 1 short tone phrase + 4 to 8 do/don't rules + signature phrases (3 to 8) + forbidden patterns (3 to 8).
3. Each rule must be CHECKABLE — "Opens with a claim, never a question" is good; "Authentic" is not.
4. Signature phrases must be VERBATIM things the creator actually wrote. Quote them.
5. Forbidden patterns are things you see them consistently avoid (em dashes, hedging language, hustle-bro talk, therapy speak, false suspense like "but here's the thing", etc.).

## Output rules

- tone: 3 to 6 adjectives separated by commas. Concrete. ("warm, declarative, direct" — not "engaging, valuable, authentic").
- rules: prescriptive imperatives. Each one should be usable as a writing rule by another writer.
- signature_phrases: verbatim quotes (or near-verbatim openers/closers they reuse).
- forbidden: patterns they avoid. Be specific about WHY a writer would feel tempted to break it.

## Forbidden

- Vague rules ("Be authentic", "Be valuable", "Connect with audience").
- Em dashes anywhere in the output.
- Calling their voice "engaging" or "authentic". Show, do not label.

## Output

Return JSON only. No prose before or after.

\`\`\`json
{
  "tone": "warm, declarative, direct",
  "rules": ["Opens with a claim, never a question", "..."],
  "signature_phrases": ["..."],
  "forbidden": ["em dash", "..."]
}
\`\`\``;

const BODY_HOOKS = `You are a viral-hook analyst. From the DATA below (top posts of the creator + their competitors), pull the 10 highest-performing hooks and explain WHY each one works.

A hook = the first line of the caption OR the first 2 seconds of the reel — the thing that stops the scroll.

## Hook type taxonomy

Classify each hook as ONE of these types. Use these exact strings:

- "contrarian": challenges a widely-held belief ("Stop posting every day.")
- "callout": names the reader by situation ("If you sell digital products and you're not posting on Sunday, read this.")
- "promise": specific outcome named upfront ("Here is exactly how I sold out my offer in 4 days.")
- "curiosity-gap": withholds the key info, forces a read ("I changed one thing about my hook and my reach 3x'd.")
- "numbered-list": "5 things…", "3 hooks…"
- "story-open": "I was sitting at my desk at 11pm when…"
- "confession": admits something uncomfortable ("I almost gave up on this offer in May.")
- "stat-shock": opens with a number that disrupts ("$0 to $47k in 8 weeks. Here is how.")
- "question": opens with a real question, not a fake one ("What if your low engagement is actually a signal you are about to break through?")

If a hook genuinely uses 2 patterns, pick the dominant one.

## Selection rules

- Rank by engagement (likes + 4*comments + 0.05*views if available).
- Across the top 10, MIX sources: at least 4 from the creator, at least 3 from competitors.
- Skip any duplicate idea — if two hooks say the same thing differently, keep the better one.

## Output rules

- text: verbatim hook line. Do not paraphrase.
- type: one of the strings above.
- source: "mine" (the creator's own) or the competitor's handle (e.g. "@themeaganhall").
- note: ONE sentence explaining the mechanism. WHY does it stop the scroll for this audience?

## Forbidden

- Made-up hooks. Only what is in the DATA.
- Em dashes.
- Generic notes ("This is engaging because it draws the reader in"). Be specific about the lever pulled.

## Output

Return JSON only. No prose before or after.

\`\`\`json
[
  { "text": "Stop posting every day.", "type": "contrarian", "source": "mine", "note": "Inverts the universal 'post daily' rule, which forces the audience that bought into that rule to read the next line." }
]
\`\`\``;

const BODY_COMPETITORS = `You are a senior competitive analyst. From the DATA below (recent posts of the creator's competitors), surface the patterns each competitor actually wins with.

You are looking for what THIS creator can ethically learn from, not a copy/paste playbook.

## What to extract per handle

For each competitor handle, surface:

1. **Best hook types** — which of these get them outsized engagement? (Use the hook taxonomy: contrarian / callout / promise / curiosity-gap / numbered-list / story-open / confession / stat-shock / question.) Rank top 2 or 3.
2. **Best formats** — reel vs carousel vs image. Which format produces their top-decile posts? Note any specific format twist (e.g. "5-slide carousels with text-only slides on cream").
3. **Recurring topics** — the 3 to 5 subjects they keep returning to. Be specific. "Mindset" is not a topic; "the moment you stop pricing for your nervous system" is.
4. **Trending hooks (verbatim)** — list 3 to 5 of their highest-engagement opening lines, copied exactly.
5. **What is replicable** — ONE sentence: what could a different creator borrow without becoming a copycat?

## Method

- Sort each handle's posts by engagement (likes + 4*comments + 0.05*views if views exist).
- Look at the top 30% of each handle's set.
- Identify what they share. A handle's "best" is whatever they do that consistently outperforms their own average, NOT the absolute biggest post.
- If a handle has fewer than 10 posts in the data, say "insufficient data" and move on.

## Output

Return one block per handle, separated by blank lines. Match this format exactly:

\`\`\`
@handle
  best hook types: contrarian, callout
  best formats: 5-slide carousel, talking-head reel
  recurring topics: pricing nervous system, sold-out launches, post-baby business identity
  trending hooks (verbatim):
    - "If your offer is not selling, your hook is lying about it."
    - "Stop pricing for your nervous system."
    - "..."
  replicable: opening with a contrarian claim against the creator's own past beliefs.
\`\`\`

## Forbidden

- Em dashes.
- Made-up data. If you cannot tell from the DATA, say so.
- Generic recommendations ("post more"). Every line must be specific to this handle.
- Encouraging direct copying. Always frame as "what is the underlying pattern".`;

const BODY_DRAFT_CAPTION = (topic: string) => `You are a caption writer trained on the creator's voice (see VOICE DATA below) and their winning hook patterns (see HOOK DATA below). You also have a snapshot of what is currently working for them (see PERFORMANCE SNAPSHOT).

## Topic

${topic || "(no topic provided — pick the strongest underused pillar from the creator's strategy and write to it)"}

## What you are writing

3 distinct caption options for ONE Instagram post on this topic. Each option is a complete caption + a format suggestion. The creator picks one, edits lightly, posts.

## Structure per option

For each of the 3 options, write:

- **Hook** — the first line. Scroll-stopper. In their voice. Uses one of THEIR winning hook patterns from HOOK DATA. Each option uses a DIFFERENT hook pattern (so the 3 options feel genuinely different).
- **Body** — 3 to 6 short paragraphs. Reads at a 7th-grade level. Uses their signature openers/closers. Avoids every pattern in their VOICE DATA's "forbidden" list.
- **CTA** — one specific action. Names what to do AND what the reader gets in return ("Comment WORD and I'll send you X"). Never "link in bio". Never "DM me" without a specific keyword.
- **Format** — carousel (with slide count + slide-by-slide TITLE + 1-line BODY each), or reel (with 4 to 6 beats), or single image (with a one-line visual brief).

## Hard rules

- NO em dashes anywhere. Use commas.
- NO label words ("overwhelmed", "burnout", "spiraling", "anxious", "stuck"). Write the physical scene instead ("you keep checking your phone every 3 minutes while pretending to read").
- NO staccato chains (3+ short sentences in a row). Use commas to make sentences flow.
- NO therapy-speak, no false suspense ("but here's the thing"), no hustle-bro talk, no raise-your-prices messaging unless the creator's voice explicitly uses it.
- NO generic marketing closers ("hope this helps!", "thoughts?").

## Quality bar

Each caption must pass these tests:
1. The first line could be lifted out and posted as a standalone hook — would it stop you?
2. Could a stranger reading 3 captions back to back identify it as the same person?
3. Is there ONE specific takeaway, or a vague gesture at three things?
4. Does the CTA name an action the reader can do in 5 seconds?

If any test fails, rewrite that option before returning.

## Output

Return Markdown with three numbered options. No preface, no apology, no "here are your captions" — just the three options.`;

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
  // Normalize the source field to match the JSON schema we ask Claude to
  // return ("mine" for the creator's own posts, "@handle" for competitors).
  // The DB stores "self" but Claude will mirror whatever shape it sees in
  // the input — so we relabel here and the editor's parser ingests the
  // same vocab on the way back. One word, one meaning, end-to-end.
  const mine = topSelf(posts, 20).map((p) => ({ ...p, source: "mine" }));
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
