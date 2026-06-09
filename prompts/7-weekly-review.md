# 07. Weekly review

**What this does:** Looks at what you posted in the last 7 days, compares to the week before, surfaces what worked, and updates Strategy with current-campaign notes if needed.

**When to run it:** Once a week. Sunday is a nice anchor.

**Reads:** `drafts` (status='posted', last 14 days), `library_posts`, `performance` (last 2 rows)
**Writes:** updates the latest `strategy` row, sets `campaigns` if anything is active

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Your task:

1. Query Supabase:
   - All `drafts` rows with `status = 'posted'` and `posted_at` in the last 14 days. Split into "this week" (last 7 days) and "last week" (7 to 14 days ago).
   - All `library_posts where source = 'self'` in the same windows, so you can match posted drafts to their actual performance using `posted_url` from drafts and `url` from library_posts.
   - The two most recent `performance` rows.

2. Build the comparison:
   - Posts this week vs last week (count + average engagement)
   - Best performing post of the week (hook + engagement + pillar)
   - Worst performing post of the week (hook + engagement + pillar) and one hypothesis why
   - Pillar split this week vs last week
   - Hook type split this week vs last week
   - Whether the week is on trend or off trend (+/- 15% engagement)

3. Read the current `strategy` row. If `campaigns` already has active entries, check whether they shipped what they promised this week. Update each campaign's `posts_done` count. If a campaign ended (deadline passed or `target_posts` reached), set its `status` to `'done'`.

4. UPDATE the latest `strategy` row with the updated `campaigns` array. Bump `updated_at`.

After writing, print a 6-line summary the user can read in 20 seconds:
- Posts this week: N (was M)
- Avg engagement: X (vs Y last week, +/-Z%)
- Best: "hook" (engagement, pillar)
- Worst: "hook" (engagement, pillar). Likely cause: <one short reason>
- Pillar shift: <X grew, Y shrank>
- Recommended focus next week: <one sentence>

Rules:
- Engagement = `likes + 4 * comments`.
- Do not invent campaigns the user hasn't created. Just update what's in `strategy.campaigns`.
- No em dashes. Use commas and short connectors.
- Be honest. If the worst post had a weak hook, say "hook was vague, no specific stake". Do not soften it.
