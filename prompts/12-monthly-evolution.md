# 12. Monthly evolution

**What this does:** Big-picture review across the month. What grew, what shrank, which pillars need pruning, what your audience changed its mind about. Updates Strategy to reflect the new reality.

**When to run it:** First day of the new month, looking at the month that just ended.

**Reads:** all of `library_posts`, `drafts`, `performance` (last 30 days), `competitors` (last 30 days), latest `strategy`
**Writes:** updates the latest `strategy` row across all fields, may suggest a new `strategy` row entirely

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Your task:

1. Define the window: last 30 days (or last calendar month if the user prefers, ask).
2. Read:
   - All `library_posts where source = 'self' and posted_at >= window_start`
   - All `drafts where status = 'posted' and posted_at >= window_start`
   - All `performance` rows in the window (compare oldest to newest to see trend)
   - All `competitors` rows in the window (one per handle, the newest)
   - The latest `strategy` row in full
3. Produce a structured report with these sections. Print each section as you go so the user can read along.

   **A. Output**
   - Total posts this month: N
   - Format spread: % Reel / % Carousel / % Image
   - Average engagement: X (vs the previous 30 days: +/-Y%)
   - Top 3 posts of the month (hook + engagement + pillar)
   - Bottom 3 posts of the month (hook + engagement + pillar + hypothesis why)

   **B. Pillar shift**
   - Target share vs actual share for each pillar
   - Which pillar grew, which shrank
   - Any pillar that should be retired (under 5% share for 2 months in a row)
   - Any new pillar that's emerging from `off-pillar` posts

   **C. Voice drift**
   - Compare the voice of this month's top 5 captions to `strategy.voice.rules`
   - Note any rule that's no longer being followed (broken in 3+ posts)
   - Note any new signature phrase that's emerging

   **D. Competitor shift**
   - For each competitor, what changed in their `best_hook_type` or `best_format` since last month
   - One pattern worth borrowing (one specific hook structure that's working for them but you haven't tried)
   - One pattern to ignore (don't fall into a copycat trap)

   **E. Recommended changes**
   - 1 to 3 specific edits to `strategy.pillars` (rename, retire, add)
   - 1 to 2 specific edits to `strategy.voice.rules`
   - 1 to 2 specific campaigns to start or stop

4. Ask the user: "Apply these changes to Strategy?"
   - If yes, UPDATE the latest `strategy` row with the recommended changes. Bump `updated_at`.
   - If no, leave Strategy untouched. Print a short summary the user can act on later.

Rules:
- This is the only prompt that's allowed to retire a pillar. Treat it carefully. If you suggest retiring a pillar, name two reasons.
- Be honest about engagement drops. Don't soften losses.
- No em dashes. No corporate hedge language. "X is working, Y is not" is the register.
- Reference specific posts (hook + url) when making claims. "Engagement dropped" without examples is too vague.
