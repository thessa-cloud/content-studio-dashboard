# 01. Extract pillars

**What this does:** Reads your 30 most recent Instagram posts, looks at what topics actually appear in them, and writes 3 to 5 content pillars to the dashboard.

**When to run it:** First time you set up the dashboard, then again every 1 to 2 months as your content evolves.

**Reads:** `library_posts` (your own, last 30)
**Writes:** new row in `strategy` (pillars + updated_at)

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. The schema is in `supabase/migrations/0001_initial_schema.sql`. The brand identity is in `config.json`.

Your task:

1. Read `config.json` and remember `brandName`, `instagramHandle`, and `tagline`.
2. Query Supabase for the last 30 rows from `library_posts` where `source = 'self'`, ordered by `posted_at desc`. If fewer than 10 rows exist, stop and tell the user to run a scrape first.
3. Read each post's `hook`, `caption`, `type`, `likes`, `comments`. Identify the recurring themes that show up across the set. Group them into 3 to 5 distinct content pillars.
4. For each pillar, write:
   - `name` (short, 2 to 4 words, no jargon)
   - `description` (one sentence, what this pillar is about for this brand)
   - `example_hooks` (array of 3 short hook lines that already appeared in the corpus)
   - `share_pct` (what percentage of the 30 posts fall into this pillar)
5. Insert one new row into `strategy` with the `pillars` field set to the array above. Leave `voice`, `campaigns`, and `ica_notes` empty for now (other prompts fill those).

After writing, print:
- The pillar names + share_pct
- A one-line note on what's missing or under-represented

Rules:
- Pillar names match the brand's actual voice from `config.json`. Do not invent topics the posts do not cover.
- No em dashes, no buzzwords, no generic marketing speak (no "lifestyle content", no "value-driven posts").
- If two pillars overlap by more than 60 percent, merge them.
