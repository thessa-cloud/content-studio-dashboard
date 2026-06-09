# 02. Extract voice

**What this does:** Reads your top 20 captions by engagement and pulls out the voice rules that make them sound like you, sentence structure, word choices, what you never do.

**When to run it:** After 1-extract-pillars, then again every 2 to 3 months.

**Reads:** `library_posts` (your own, top 20 by engagement)
**Writes:** updates the latest `strategy` row, sets `voice`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`. Brand identity in `config.json`.

Your task:

1. Query Supabase: top 20 rows from `library_posts` where `source = 'self'`, ordered by `(likes + 4 * comments) desc`. If fewer than 10 rows exist, stop and ask the user to run a scrape first.
2. Read the full `caption` of each. Pay attention to:
   - Average sentence length and rhythm
   - First-line patterns (hook style)
   - Recurring phrases and vocabulary
   - Punctuation habits (does this writer use commas? bullets? line breaks?)
   - What is consistently absent (no em dashes, no emoji, no questions, no slang, etc.)
3. Distill into a voice object with these fields:
   - `tone` (one short phrase, e.g. "warm, declarative, direct")
   - `rules` (array of 5 to 8 short do/don't statements written in the writer's own register)
   - `signature_phrases` (array of 3 to 6 phrases that show up more than once in the top set)
   - `forbidden` (array of things this writer never uses: filler words, hedges, em dashes if absent, hashtag spam, etc.)
4. Update the most recent row in `strategy` (the one created by prompt 01) and set the `voice` field. Bump `updated_at` to now.

After writing, print the full voice object so the user can see what was captured.

Rules:
- Voice rules quote the actual posts where possible. "Always opens with a declaration, never a question" beats "use a strong hook".
- No em dashes in your own output. If the writer does not use them, add "no em dashes" to `forbidden`.
- Do not invent rules the captions do not support.
- Keep `rules` actionable. Each one is something the next caption can be checked against.
