# 16. Draft a reel script

**What this does:** Writes a complete Instagram reel script in your voice. Picks between B-roll (text overlay + trending audio) and voiceover (spoken script) based on the topic and your goal.

**When to run it:** When you have a topic or concept and want a finished reel ready to film or assemble.

**Reads:** `strategy` (latest, voice + pillars), `performance` (latest, top_posts)
**Writes:** new row in `drafts` with `type = 'reel'`, `status = 'draft'`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Ask the user for:

1. **Topic or concept** (one short sentence: what's this reel about?)
2. **Goal** (saves / DMs / comments / drive an offer)
3. **Format preference** (B-roll text overlay / voiceover spoken script / unsure). If unsure, default to B-roll (faster to ship, ~70% of best-performing reels).
4. **Optional pillar** (if they skip, pick the best fit from `strategy.pillars`)
5. **Optional trigger word** for the CTA (defaults to `config.triggerWords`)

Then:

1. Read latest `strategy` row. Pull `voice.tone`, `voice.rules`, `voice.signature_phrases`, `voice.forbidden`.
2. Read latest `performance` row. Note which hook types are over-used recently and pick a different one for this reel.
3. Decide format:
   - **B-ROLL (70% of content):** 1 powerful text overlay + visual mood + trending audio. 15-30 seconds. No spoken voiceover.
   - **VOICEOVER (30% of content):** Hook (0-1s) → Problem/Desire (1-5s) → Shift (5-8s) → CTA (8-10s). Use when the topic needs teaching, transformation, or personal authority.

### If B-ROLL — return this format:

```
TEXT OVERLAY:
[Single powerful statement or question. Max 7 words. Stops scroll in 1-2 seconds.
 Structure from library patterns: "POV: …", "My biggest flex is…", "Things I refuse to do as a woman who…", "Girl math: …", "I used to love X. Then I realized Y.", etc.]

VISUAL DIRECTION:
- Opening visual (1-2s): [scene that matches the overlay]
- Scene progression: [quick cuts or smooth flow?]
- Aesthetic: [beach sunset, luxury apartment, calm workspace, vibey coffee shop, etc.]
- Pacing: [match the audio rhythm]
- Text placement: [bottom, center, when does it appear?]

AUDIO SUGGESTION:
[Trending sound name + one line on why it works for this vibe.]

CAPTION:
[Instagram caption in the writer's voice. 2-4 sentences. Context, why it matters, CTA with keyword.]
```

### If VOICEOVER — return this format:

```
HOOK (0-1s):
[Opening line. Declarative. Specific. Stops scroll in the first second.]

PROBLEM / DESIRE (1-5s):
[Build tension or desire. Show why this matters. Storytelling or teaching, not selling.]

SHIFT / SOLUTION (5-8s):
[The promise. What changes when they take action. Claiming energy, not tentative.]

CTA (8-10s):
[Specific action: "Comment WORD and I'll send you X" — never bare "Comment WORD".]

VOICEOVER SCRIPT (word for word):
[Full spoken script written the way you'd actually say it out loud. Use commas to flow. Read it aloud to test.]

VISUAL DIRECTION:
- Pacing: [fast cuts for urgency, smooth for education]
- Aesthetic: [scene to match]
- B-roll scenes: [hands with coffee, looking out window, laptop screen, etc.]
- Text overlays: [where + which key phrases to bold]

AUDIO SUGGESTION:
[Background music at 30-50% volume that underlays the voiceover without drowning it.]

CAPTION:
[Full caption in the writer's voice. CTA with keyword.]
```

After writing, INSERT into `drafts`:
- `caption` = the full reel output (TEXT OVERLAY block or HOOK→CTA block + caption)
- `hook` = the text overlay (B-roll) or the spoken hook (voiceover)
- `type` = `'reel'`
- `slide_count` = 1
- `pillar`, `trigger_words`, `status` = `'draft'`
- `notes` = "B-roll" or "Voiceover" + which library pattern was used as the structural model

Rules:
- No em dashes anywhere. Use commas.
- No label words ("overwhelmed", "burnout", "stuck"). Scene-based copy only.
- No victim framing ("I was struggling until…"). "I figured out that…" or "I chose to…" instead.
- No hype openers ("You won't believe…"). Declarative + specific.
- Declarative & certain. Warm & luxurious. "You get to have this", not "Maybe you could try".
- Personal "I / me / my" language. Drop "you should…" framing.
- Specific over general ("the friend who doesn't work but has more money" beats "passive income").
- If the topic doesn't fit any pillar in `strategy.pillars`, ask the user before saving. Do not invent a pillar.
