# 11. Objection library

**What this does:** Reads your post comments (and your competitors' comments) to extract the recurring objections, questions, and confusions your audience has. Builds an FAQ-style reference in Strategy.

**When to run it:** Monthly. After a launch is a good moment.

**Reads:** `library_posts` (self + competitors, sorted by `comments desc`)
**Writes:** updates the latest `strategy` row, adds an `objection_library` field

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

This prompt assumes your scraper has captured comment text into the `raw` JSONB column of `library_posts` (under a `comments_sample` key). If not, you can still run this prompt against your own DMs or manually pasted comments, ask the user.

Your task:

1. Query Supabase for the top 30 rows from `library_posts` (self + competitors) ordered by `comments desc`. From each row's `raw.comments_sample` (if present), collect the comment text. Combine into one large set of comments.
2. Read each comment. Classify into:
   - **Objection** (a reason someone resists buying or believing the offer: price, time, trust, "this won't work for me")
   - **Question** (genuine clarification need)
   - **Praise** (skip these)
   - **Spam** (skip these)
3. Group all Objections + Questions into 6 to 10 buckets by theme. For each bucket:
   - `theme` (e.g. "Price too high", "Will this work for beginners?", "I don't have time")
   - `frequency` (how many comments map to this bucket)
   - `verbatim_examples` (3 real comment quotes, source-attributed)
   - `counter_angle` (the strongest one-sentence response, written in the brand voice from `strategy.voice`)
4. UPDATE the latest `strategy` row. Add an `objection_library` field:
   ```json
   {
     "updated_at": "2026-01-15T10:00:00Z",
     "buckets": [
       {
         "theme": "...",
         "frequency": N,
         "verbatim_examples": [{ "source": "self|@handle", "text": "..." }],
         "counter_angle": "..."
       }
     ]
   }
   ```

After writing, print a one-line summary per bucket: theme + frequency + counter_angle.

Rules:
- Counter-angles follow the same voice rules as everything else (`strategy.voice`). No em dashes, no generic reassurance ("don't worry, it'll be fine"). Specific scene + specific outcome.
- Quote comments verbatim. Do not paraphrase.
- If no comment data exists in `raw.comments_sample`, ask the user to paste 20 to 50 recent comments and proceed from there.
- Order buckets by `frequency desc`. The most common objection comes first.
