# 09. Build content week

**What this does:** Generates 5 to 7 drafts for the next week, balanced across pillars, hook types, and formats. One paste, full week ready to review.

**When to run it:** Sunday or Monday morning. Or whenever you want to batch a week.

**Reads:** `strategy` (latest), `performance` (latest), `library_posts` (self, last 30)
**Writes:** 5 to 7 new rows in `drafts` with `status = 'draft'`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`. Brand identity in `config.json`.

Ask the user for:

1. **How many posts** (5, 6, or 7, default 5)
2. **Any forced topics** (optional, comma-separated, e.g. "launch announcement, behind the scenes of the studio")
3. **Format spread** (default: 60% Reel, 30% Carousel, 10% Image, override if asked)

Then:

1. Read the latest `strategy.pillars`, `strategy.voice`, `strategy.campaigns`. Read the latest `performance.top_posts` + `performance.hook_type_mix`.
2. Read the last 30 `library_posts where source = 'self'` to see what was recently posted and avoid repeating angles.
3. Plan the week:
   - Distribute across pillars proportional to their `target_share_pct`. Bias slightly toward under-used pillars (use prompt 08's logic in your head).
   - Distribute hook types so the week covers at least 3 different ones. Bias toward hook types that are working in `performance.top_posts` and away from over-used ones in `hook_type_mix`.
   - Apply the format spread.
   - If `campaigns` has active entries with `posts_remaining > 0`, include those campaign posts first and count them against the total.
   - Avoid repeating an angle that appeared in the last 30 posts.
4. For each planned post, draft the caption following the same rules as prompt 05 (`5-draft-caption.md`). Use the format-specific structure (Reel script / Carousel slides / Image caption).
5. Insert each into `drafts` with:
   - `status = 'draft'`
   - all the metadata (pillar, hook_type, format, trigger_words from `config.triggerWords`, slide_count for carousels, notes explaining the pick)

After writing, print a one-line summary per draft:
- Day | Format | Pillar | Hook type | First line of the caption (truncated to 80 chars) | draft_id

Rules:
- One CTA trigger word per draft, spread across `config.triggerWords` so the week is not all the same keyword.
- No two drafts open with the same hook structure. Vary opening lines explicitly.
- No em dashes. CTA names the action.
- If the user supplied "forced topics", those override the auto-plan, fit them in first and balance the rest around them.
- Do not schedule the drafts. They stay in `status = 'draft'` so the user reviews first.
