# 15. Draft an Instagram story sequence

**What this does:** Writes a 1 to 4 slide story sequence in your voice, designed to drive a single keyword DM reply. Text overlays only — no visual direction, no scene description (you know what to point your camera at).

**When to run it:** When you have an offer or a freebie to promote and want a friend-sharing-a-secret story sequence, not a sales pitch.

**Reads:** `strategy` (latest, voice + trigger words), `performance` (latest, top_posts)
**Writes:** new row in `drafts` with `type = 'story'`, `status = 'draft'`

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Ask the user for:

1. **Offer or freebie being teased** (e.g. "SellBySunday tool", "Rich & Rested freebie", "Bundle launch")
2. **Trigger keyword** (the word the viewer replies in DM — usually one short distinctive word, defaults to `config.triggerWords`)
3. **Promise to the reader** (the specific thing they get when they reply the keyword)
4. **Optional arc length** (1 slide proof-close / 1 slide secret-share / 3 slide warm-up + close / 4 slide tease-bridge-offer-followup). If they skip, pick based on offer warmth.
5. **Optional real proof number** (a real $ amount + real timeframe, e.g. "$2,782 in 14 days from a $47 product"). If they skip, use a generic placeholder and flag it.

Then:

1. Read latest `strategy` row. Pull `voice.tone`, `voice.rules`, `voice.signature_phrases`, `voice.forbidden`.
2. Pick arc:
   - **Arc A · Single-slide proof close** (1 slide). Real number + emotional reaction + CTA in one overlay block. Best when the proof is fresh and undeniable.
   - **Arc B · Single-slide secret-share** (1 slide). Conversational opener ("Ok I actually have a way to…") + outcome promise (verb + concrete time + audience benefit) + sentence-fragment proof + CTA. Best for soft mid-feed drops.
   - **Arc C · 3 slide warm + close**. Slide 1 = personal warm moment + tension. Slide 2 = the value or shift. Slide 3 = offer + CTA with keyword.
   - **Arc D · 4 slide tease-bridge-offer-followup**. Slide 1 = hook. Slide 2 = bridge the value to the offer. Slide 3 = clear ask. Slide 4 = catches the hesitation.
3. Write every overlay as text only. **Never describe the visual.** No "Visual:", no "Photo:", no "Background:", no "[at the pool]", no bracketed scene cues.
4. Every CTA shape: `Reply [KEYWORD] and I'll [verb that delivers the promise]` (e.g. "Reply SUNDAY and I'll send you the link", "Reply BUNDLE and I'll show you how"). Never bare "DM me". Never "link in bio". Never "swipe up".
5. One emoji max per slide, placed right after the proof number or the emotional reaction. One ALL-CAPS word max per slide (the keyword OR the spike word, not both).
6. INSERT into `drafts`:
   - `caption` = the full story sequence with each slide labeled "Overlay 1:", "Overlay 2:", etc.
   - `hook` = slide 1 overlay (or the single overlay if Arc A/B)
   - `type` = `'story'`
   - `slide_count` = number of slides in the arc
   - `trigger_words` = `[KEYWORD]`
   - `notes` = arc letter + promise teased

After writing, print the sequence in this exact format so the user can copy each slide one at a time:

```
Overlay 1:
[exact words on slide]

Overlay 2:
[exact words on slide]
```

Rules:
- ENGLISH ONLY. Story copy is in English even if the writer chats in another language elsewhere.
- No em dashes anywhere. Use commas or full stops.
- No visual direction. Not in parentheses, not in brackets, not anywhere.
- No labels like "Hook:", "Proof:", "CTA:" inside the overlay text itself. Use "Overlay 1:", "Overlay 2:" as separators only.
- No victim framing ("I was struggling until…"). Claim the outcome.
- No hype ("You won't believe…"). Certainty, not excitement.
- Numbers are exact and real ($2,782 beats "over $2,700"). Precision = credibility.
- Product or offer name never appears as the subject of sentence 1 (kills the secret-share frame). It appears in the keyword and optionally once in the proof line.
