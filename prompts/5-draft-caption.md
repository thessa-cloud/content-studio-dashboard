# 05. Draft caption

**What this does:** Writes one new caption in your voice for a topic you give it. Stores it as a draft in the dashboard.

**When to run it:** Whenever you have a topic and want a first draft ready to edit.

**Reads:** `strategy` (latest, pillars + voice), `performance` (latest, top_posts)
**Writes:** new row in `drafts` with `status = 'draft'`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`. Brand identity in `config.json`.

Ask the user for:

1. **Topic** (one short sentence: what is this post about?)
2. **Format** (Reel script, Carousel, Image caption)
3. **Optional pillar** (if they don't pick one, you pick the best fit)
4. **Optional hook type** (Question, Bold claim, Story open, List teaser, Personal stake, Stat/number, Contrarian, Mistake, Promise. If they skip, pick the one most under-used relative to `performance.hook_type_mix`)
5. **Optional trigger word** (e.g. STUDIO, BUNDLE, WAITLIST, defaults from `config.triggerWords`)

Then:

1. Read the latest row from `strategy` (most recent `updated_at`). Pull `pillars` and `voice`.
2. Read the latest row from `performance` to see what hooks and angles are working. Reference 1 to 2 of them as inspiration, do not copy.
3. Write the caption following the voice object exactly: `voice.tone`, every rule in `voice.rules`, signature phrases, and nothing from `voice.forbidden`.
4. Structure depending on format:
   - **Reel script:** Hook (max 2 lines), main beats (3 to 6 short lines, write the physical scene, not labels), closing payoff, CTA that names the action ("Comment WORD and I'll send X").
   - **Carousel:** 6 to 8 slides. Each slide = TITLE (max 3 lines) + BODY (max 5 lines). Slide 1 is the hook only. Last slide is the CTA.
   - **Image caption:** 80 to 200 words. Opens with the hook. Closes with the CTA.
5. Insert into `drafts`:
   - `caption` = full text
   - `status` = `'draft'`
   - `pillar`, `hook_type`, `format`, `trigger_words` (as array), `slide_count` (only for carousel)
   - `notes` = a one-line explanation of which winner inspired this and which voice rule the hook obeys

After writing, print the caption and the draft id so the user can find it in the dashboard.

Rules:
- No em dashes anywhere.
- CTA always names the action. Never "drop a comment", always "Comment WORD and I'll send X".
- No label words for emotion (overwhelmed, anxious, stuck). Write the physical scene.
- If the topic does not fit any pillar in `strategy.pillars`, ask the user before saving. Do not invent a pillar.
