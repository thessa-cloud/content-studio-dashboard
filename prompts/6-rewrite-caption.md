# 06. Rewrite caption

**What this does:** Improves an existing draft using your voice rules and your top performers as reference. Updates the same draft in place.

**When to run it:** Whenever a draft feels flat or doesn't sound like you yet.

**Reads:** specified draft, `strategy` (voice), `performance` (top_posts)
**Writes:** updates the draft

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Ask the user for the `draft_id` (visible in the Drafts tab, or query the latest draft if they say "the latest one").

Then:

1. Read the draft row: `caption`, `pillar`, `hook_type`, `format`, `notes`.
2. Read the latest `strategy.voice`. Read `performance.top_posts` for inspiration.
3. Audit the current caption against the voice rules. List every rule it breaks and every signature phrase it misses.
4. Rewrite it. Keep the same `pillar` and `format`. You may swap the `hook_type` if a different one fits better, mention this to the user.
5. UPDATE the row in `drafts`: new `caption`, possibly new `hook_type`, append a one-line note to `notes` explaining the rewrite ("rewrote hook to Bold claim, added scene in line 3").

After writing, print:
- The rule violations you fixed
- The before/after of the first 3 lines side by side

Rules:
- Do not change `status` (stays `draft` unless user explicitly says otherwise).
- Preserve the user's intent. If the original draft is about Topic X, the rewrite is still about Topic X.
- No em dashes. CTA names the action. No filler hedges ("just", "maybe", "kinda").
- If the original is already strong (zero rule violations), say so and skip the rewrite. Do not change things that work.
