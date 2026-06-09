# 10. Hook library

**What this does:** Builds a reusable list of hook templates that work, both from your own top performers and from your competitors. Lives in Strategy as a swipeable reference.

**When to run it:** After 3-analyze-winners and 4-competitor-patterns have both run at least once.

**Reads:** `performance.top_posts`, `competitors.trending_hooks`
**Writes:** updates the latest `strategy` row, adds a `hook_library` field

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Your task:

1. Read the most recent `performance` row. Pull `top_posts` (10 of your own winners).
2. Read all rows from `competitors`. For each handle, pull `trending_hooks` (top 5). Combine into one big list.
3. For each hook in both sets:
   - Identify the structural pattern (e.g. "Bold claim + specific number", "Story open in second person", "Contrarian against a common belief")
   - Strip the specifics so the pattern is reusable. E.g. "I made $14k in 3 days from one Reel" becomes "I made [outcome] in [short timeframe] from [one specific action]"
4. Group patterns into 6 to 10 buckets by `hook_type`. For each bucket:
   - Pattern name
   - Skeleton (the reusable template with placeholders)
   - 2 to 3 real examples from the corpus (verbatim, with attribution: "self" or "@competitor")
   - When to use it (one short sentence)
5. UPDATE the latest `strategy` row. Add a `hook_library` field with the structure:
   ```json
   {
     "updated_at": "2026-01-15T10:00:00Z",
     "buckets": [
       {
         "hook_type": "Bold claim",
         "pattern_name": "Specific number + short timeframe",
         "skeleton": "I [outcome] in [timeframe] from [action]",
         "examples": [
           { "source": "self", "hook": "..." },
           { "source": "@handle1", "hook": "..." }
         ],
         "when_to_use": "When the outcome is genuinely impressive and the timeframe is short"
       }
     ]
   }
   ```

After writing, print one example per bucket so the user can see the swipe file.

Rules:
- Hooks must be deduplicated by pattern, not by exact text. If 4 competitors all use the same skeleton, that's ONE entry with 4 examples.
- Attribute every example. Never strip the source.
- No em dashes. No "10x your engagement" type generic hooks unless they actually appear in the data.
- If fewer than 15 hooks total exist across self + competitors, stop and ask the user to run more scrapes first.
