# 04. Competitor patterns

**What this does:** For each competitor handle in `config.json`, reads their scraped posts and writes a competitor row, top hooks, best hook type, best format. The Intel tab renders this.

**When to run it:** After a scrape that includes competitor handles. The dashboard supports up to 5 competitors.

**Reads:** `library_posts` (rows where `source = '@handle'`)
**Writes:** one new row per handle in `competitors`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`. The handles to analyze come from `config.competitors` in `config.json`.

Your task:

1. Read `config.json` and get the `competitors` array. Strip the leading `@` from each handle.
2. For each handle, query Supabase: all rows from `library_posts` where `source = '@' || handle`. If fewer than 5 posts exist for that handle, log "skipping @handle, not enough data" and move on.
3. For each handle, compute:
   - `top_posts` = 8 highest by `(likes + 4 * comments)`. For each: `{ hook, type, likes, comments, views, url, hook_type, timestamp: posted_at }`. Classify each hook into one of: Question, Bold claim, Story open, List teaser, Personal stake, Stat/number, Contrarian, Mistake, Promise.
   - `trending_hooks` = top 5 by engagement, just the hook + hook_type + engagement number
   - `trending_formats` = `{ Reel: count, Carousel: count, Image: count }` across the full set
   - `best_hook_type` = the hook_type that appears most often in `top_posts`
   - `best_format` = the format (Reel/Carousel/Image) with highest average engagement, not just count
4. Insert one new row into `competitors` per handle. `scraped_at` defaults to now().

After writing, print a summary: one line per handle showing best_hook_type, best_format, and the strongest hook (truncated to 80 chars).

Rules:
- Treat handles case-insensitively. Store them lowercased without the `@`.
- Engagement = `likes + 4 * comments`.
- If a competitor has both `Reel` and `Sidecar`, normalize `Sidecar` to `Carousel`.
- No em dashes. Quote competitor hooks verbatim when displaying them.
- Do not compare the user's account to competitors here. This prompt is descriptive only.
