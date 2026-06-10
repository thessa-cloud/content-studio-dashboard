# 13. Draft a carousel

**What this does:** Writes a complete Instagram carousel (slide-by-slide TITLE + BODY, plus visual direction) on a topic you give it, in your voice, using a viral carousel framework.

**When to run it:** When you want a finished carousel ready to load into Canva or Instagram's native editor.

**Reads:** `strategy` (latest, voice + pillars), `performance` (latest, top_posts)
**Writes:** new row in `drafts` with `type = 'carousel'`, `status = 'draft'`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Ask the user for:

1. **Topic** (one short sentence: what is this carousel about?)
2. **Goal** (saves / DMs / comments / sells the offer)
3. **Optional pillar** (if they skip, pick the best fit from `strategy.pillars`)
4. **Optional framework** (Master = Hook → Context → 3-4 Points → Proof → CTA, or Comeback = Hook → What Happened → Consequences → Comeback Plan → Results → Takeaway). If they skip, pick based on topic shape.
5. **Optional trigger word** (drives the CTA, defaults to `config.triggerWords`)

Then:

1. Read latest `strategy` row. Pull `voice` (tone, rules, signature_phrases, forbidden) and `pillars`.
2. Read latest `performance` row. Reference 1 to 2 winning hooks as structural inspiration, do not copy.
3. Pick slide count: 7 to 10. Personal hooks plus short body per slide outperform 5 long slides.
4. Write every slide as a TITLE + BODY pair. **No slide is just a title.**
   - **TITLE** — max 3 lines. The bold statement. The thing they read first.
   - **BODY** — max 5 lines. The reasoning, scene, or detail that lands the title.
5. Slide 1 = hook only (title-strong, body sets up the swipe). Use personal language ("I", "me", "my"). Add a micro-cliffhanger feel ("but here's the thing…", "one last thing 👉").
6. Slides 2-N = one idea per slide. Show the physical scene, never label it ("you sit down to work, don't know where to start, so you don't start at all" beats "overwhelm").
7. Final slide = CTA. Specific action + what they get ("Comment WORD and I'll send you X"). Never "link in bio". Never bare "DM me".
8. INSERT into `drafts`:
   - `caption` = the carousel hook + 1-line summary of each slide (the writer will copy slides to Canva separately)
   - `hook` = slide 1 title
   - `type` = `'carousel'`
   - `slide_count` = exact count
   - `pillar`, `trigger_words`, `status` = `'draft'`
   - `notes` = framework used + which winning hook inspired the opener

After writing, print every slide in this exact format so the user can paste into Canva:

```
SLIDE 1
TITLE: [max 3 lines]
BODY: [max 5 lines]

SLIDE 2
TITLE: ...
BODY: ...
```

Then under PART 2 give visual direction per slide: background tone, where the eye lands, any italic-emphasis word, photo cue if any.

Rules:
- No em dashes. Use commas.
- No label words ("overwhelmed", "burnout", "stuck", "spiraling", "anxious"). Scene-based copy only.
- No staccato chains. Use commas to make sentences flow.
- No corporate openers ("In today's market…"). No false suspense ("but here's the thing…" unless it earns the swipe).
- Personal "I/me/my" language drives reach. Avoid "you should…" and "experts say…".
- If the topic doesn't match any pillar in `strategy.pillars`, ask the user before saving. Do not invent a pillar.
