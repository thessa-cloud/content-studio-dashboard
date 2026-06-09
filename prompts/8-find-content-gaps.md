# 08. Find content gaps

**What this does:** Compares your intended pillar mix to what you actually posted, finds under-used pillars and over-used ones. Surfaces topic ideas inside the gaps.

**When to run it:** Mid-month, or whenever you feel stuck for ideas.

**Reads:** `strategy.pillars`, `library_posts` (self, last 30)
**Writes:** nothing to Supabase. Prints a list the user can act on.

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Your task:

1. Read the latest `strategy.pillars` array. Each pillar has a target `share_pct` from prompt 01.
2. Query the last 30 `library_posts where source = 'self'`. Classify each into one of the pillars (use the descriptions in `strategy.pillars`). If a post doesn't fit any pillar, mark it `off-pillar`.
3. For each pillar, compute:
   - `actual_share_pct` = `count / 30 * 100`
   - `delta_pct` = `actual_share_pct - target_share_pct` (negative = under-used)
4. Find the 2 most under-used pillars (most negative `delta_pct`). For each, generate 5 concrete topic ideas. Each idea is:
   - one short sentence (the angle)
   - one hook line in the brand's voice
   - one recommended `hook_type` and one recommended `format` (Reel / Carousel / Image)
   - reference to one top-performing post on a related angle (from `performance.top_posts`) so the user can see why this might work

After printing, ask the user if they want to turn any of these into drafts. If yes, hand off to prompt 05 (`5-draft-caption.md`) for each one.

Rules:
- Topic ideas are specific. "Talk about pricing" is not an idea. "Why I increased my pricing 3x in 6 months and got more buyers, not fewer" is an idea.
- Do not generate ideas for pillars that are already at or above target.
- No em dashes. No "value content" / "lifestyle content" / generic placeholders.
- If `off-pillar` posts make up more than 25% of the 30, point this out separately and ask the user whether their pillars need updating (rerun prompt 01).
