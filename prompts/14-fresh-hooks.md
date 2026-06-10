# 14. Fresh hooks for a topic

**What this does:** Generates 10 ready-to-use hook options for a single topic, each using a different proven viral hook framework, in your voice. Different from `10-hook-library` which is a META analysis of past winners.

**When to run it:** When you have a topic but are stuck on the opening line. Run this, pick the strongest, paste into the carousel / reel / caption you're writing.

**Reads:** `strategy` (latest, voice), `performance` (latest, hook_breakdown + top_posts)
**Writes:** nothing. Output is ephemeral, you copy the hook you want.

---

You are working inside a Content Studio Dashboard project. Supabase credentials live in `.env.local`. Schema in `supabase/migrations/0001_initial_schema.sql`.

Ask the user for:

1. **Topic** (one short sentence: what's the post about?)
2. **Format** (carousel slide 1 / reel first 2 seconds / caption first line / story overlay 1)
3. **Optional underused hook type** (if they want to deliberately use a framework that's under-represented in their `performance.hook_breakdown`)

Then:

1. Read latest `strategy` row. Pull `voice.tone`, `voice.rules`, `voice.signature_phrases`, `voice.forbidden`.
2. Read latest `performance` row. Identify which hook types are over- and under-used in `hook_breakdown`. If the user didn't specify, vary so the 10 options pull from at least 6 different frameworks.
3. Write **10 distinct hooks** for this single topic. Each hook follows ONE of these 9 frameworks (label which one):
   - **Conversational** (mid-thought entry, like walking in on a friend talking)
   - **Process Shift** (what actually changed, not the surface tip)
   - **Vulnerability / Confessional** (admits what nobody says)
   - **Internal Realization** (the moment a belief shifted)
   - **Hard-Learned Lesson** (the time wasted before figuring it out)
   - **Transformation** (struggle → current state, without bragging)
   - **Real Talk / Truth Bomb** (challenges a commonly accepted excuse)
   - **Comment-to-Trigger** (CTA as the opener, "Comment WORD…")
   - **Compressed Visual-Carry** (5 words or fewer, or pure emoji, only when the visual carries the message)

Each hook must:
- Sound like the writer is texting a friend, not pitching a customer.
- Create tension (contrast, implication, reversal, confession, or incomplete statement).
- Match the format. Carousel slide 1 = max 2 lines. Reel = max 7 words spoken in 1 second. Caption = first 8-12 words. Story overlay = max 14 words.
- Use the writer's voice rules. Avoid every pattern in `voice.forbidden`.

For each hook, output:
- The hook itself (verbatim, ready to copy)
- The framework label (one of the 9 above)
- One sentence on the lever it pulls (why this stops the scroll for this audience)

Rules:
- No em dashes anywhere.
- No hype openers ("You won't believe…", "Here's how to…", "This one weird trick…"). They scan as marketing.
- No fake suspense ("but here's the thing…" without an actual thing).
- Never "Swipe up". Never "Link in bio". Never bare "DM me".
- Personal "I / me / my" language wins over "you should…".
- If 2 hooks end up using the same framework, replace one before returning.

Output as a numbered Markdown list (1-10), each entry on 3 lines: hook / framework / lever. No preface, no apology, no "here are your hooks" — just the 10.
