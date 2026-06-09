# 03. Analyze winners

**What this does:** Sorts your library by engagement, picks the top performers, and writes a snapshot to the Performance tab, top posts, best pillar, best hook type, format mix.

**When to run it:** After every scrape (or at least weekly).

**Reads:** `library_posts` (your own, all of it)
**Writes:** new row in `performance`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Your task:

1. Query Supabase for all rows from `library_posts` where `source = 'self'`. If fewer than 5 rows exist, stop.
2. Compute these aggregates:
   - `followers` (if available from a separate source; otherwise leave null)
   - `avg_likes` = mean of `likes` across the set, rounded
   - `top_posts` = 10 highest by `(likes + 4 * comments)`. For each: `{ hook, type, likes, comments, views, url, pillar, hook_type, timestamp: posted_at }`
   - `best_pillar` = the pillar that appears most often in the top 10 (you must have already run prompt 01 so posts have a `pillar` field; if not, classify each top-10 post into one of the pillars from `strategy.pillars` before counting)
   - `best_hook_type` = same logic, but for `hook_type`. If posts don't have a `hook_type` set yet, classify each top-10 hook into one of: Question, Bold claim, Story open, List teaser, Personal stake, Stat/number, Contrarian, Mistake, Promise. Then count.
   - `pillar_mix` = `{ pillar_name: count }` across the full library
   - `hook_type_mix` = `{ hook_type: count }` across the full library
3. Insert one new row into `performance` with all the above. `scraped_at` defaults to now().

After writing, print:
- The top 3 posts with their hook + engagement
- `best_pillar` and `best_hook_type`
- The percentage split for `hook_type_mix`

Rules:
- If a post is missing `pillar` or `hook_type`, classify it on the fly using the strategy from `strategy.pillars` and the hook type list above. Do not skip them.
- Engagement = `likes + 4 * comments`. Comments weigh more because they're scarcer.
- No em dashes in your output. Use commas.
- Write JSON for arrays/objects, not stringified versions.
