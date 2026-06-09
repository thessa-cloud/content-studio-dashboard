# Content Studio Dashboard — Product Spec v1

**Status:** ✅ APPROVED — building started 2026-06-08
**Date:** 2026-06-08
**Branding:** REVENU classic, Red theme (burgundy `#741616` + cream `#eae2da` + Editor's Note H1/H2 + Inclusive Sans body)
**Project folder:** `/root/projects/content-studio-dashboard/`

---

## What it is

A 1-click deployable dashboard + Claude Code prompt pack + setup PDF, so REVENU customers get their own version of Thessa's Content Studio.

Customers connect their Apify account, scrape their Instagram on demand, and use their Claude Code subscription to draft, analyze, and learn from their content directly inside the dashboard.

One product, one price, two installation paths in the PDF. No backend AI, no Anthropic API, no cron, no GitHub friction.

---

## Pricing

**$47 one-time.** Locked anchor next to SellBySunday ($47). Final keyword: **STUDIO** for ManyChat.

---

## What the customer gets (3 deliverables)

### 1. The Dashboard (Vercel template, 1-click deploy)
Browser-based, pre-styled, customizable. Lives on `<their-name>.vercel.app` within 5 minutes of clicking the button.

Five tabs:

| Tab | What lives here |
|---|---|
| **Drafts** | Caption writer with status (draft / scheduled / posted), trigger word tagger, slide count, notes field. Same UX as REVENU's own. |
| **Strategy** | Their content pillars, voice rules, ICA notes, current campaigns. Filled by Claude via prompts. |
| **Performance** | Their top performing posts, hooks, topics. Sorted by engagement. Filtered by format (reel / carousel / story). |
| **Intel** | Up to 5 competitor handles. Their top hooks and patterns. Refresh on demand. |
| **Library** | Raw scrape data. Searchable, filterable. The data Claude reads when running learning prompts. |

Top right of every page: **`[ Scrape now ]`** button + `Last scraped: X hours ago` timestamp.

### 2. The Claude Code Prompt Pack (12 prompts, .md files)

Drop-in prompts they paste into Claude Code or Claude.ai chat. Each one reads their Supabase, processes it, writes patterns back to the dashboard.

| Prompt | What it does |
|---|---|
| `1-extract-pillars.md` | Reads 30 latest posts, extracts their content pillars, writes to Strategy tab |
| `2-extract-voice.md` | Reads top 20 captions, extracts their voice rules, writes to Strategy |
| `3-analyze-winners.md` | Top 10 hooks + topics + formats, writes to Performance |
| `4-competitor-patterns.md` | Reads competitor scrapes, surfaces top hooks, writes to Intel |
| `5-draft-caption.md` | Writes caption in their voice for a given topic |
| `6-rewrite-caption.md` | Improves an existing draft using their winners |
| `7-weekly-review.md` | Reviews past week, updates Strategy |
| `8-find-content-gaps.md` | What pillars are underused, what to post more of |
| `9-build-content-week.md` | Drafts 5-7 captions for upcoming week |
| `10-hook-library.md` | Builds their personal hook library from winners |
| `11-objection-library.md` | Extracts FAQ/objections from comments, writes to Strategy |
| `12-monthly-evolution.md` | Big-picture monthly review, what shifted, what to lock |

### 3. The Setup Gids PDF (15-20 pages)

REVENU-branded, classy editorial layout, two clear paths.

**Path A → Tech Baddie route (~10 min)**
For customers comfortable with code/terminal.
1. Click Deploy button → Vercel auto-clones template
2. Paste Apify token in Vercel env vars
3. Open repo in Cursor/VS Code
4. Open Claude Code, paste first prompt
5. Done

**Path B → Tech Starter route (~20 min)**
For customers who've never coded.
1. Click Deploy button → log into Vercel (screenshot)
2. Create free Apify account (screenshot per step)
3. Find Apify token, paste into dashboard settings page (no code)
4. Download Claude Code for Mac or Windows (screenshots both)
5. Open terminal, run `claude`, paste first prompt
6. Refresh dashboard, see patterns appear
7. Done

Both paths land on same end state. Includes 3 Looms: deploy walkthrough, first scrape, first Claude prompt.

---

## What the customer needs (their costs)

| Item | Cost | Notes |
|---|---|---|
| Content Studio Dashboard | $47 one-time | This product |
| Vercel hobby plan | $0 | Free tier covers it |
| Supabase free tier | $0 | Free tier covers it |
| Apify free tier | $0 | $5 free credit/month covers ~3 scrapes/month |
| Claude Code subscription | $20/month | They likely already have this |
| Anthropic API | $0 | Not needed, all AI runs via their Claude Code |

**Total ongoing cost: $0 (if they have Claude Code).** That's the headline.

---

## What we (REVENU) need to build

### Phase 1: Generic dashboard template (~12 hours)
- Fork REVENU's `revenu-content-studio` repo
- Strip all REVENU-specific copy, pillars, examples
- Replace hardcoded trigger words with config.json
- Add `[Scrape now]` button + last-scraped UI to every tab
- Add Settings tab for Apify token + theme color picker (burgundy / dark pink / custom)
- Add Supabase migration that runs on first deploy
- Vercel deploy button + template repo setup

### Phase 2: Claude Code prompt pack (~5 hours)
- Write all 12 prompts, generic enough to work for any niche
- Each prompt references their Supabase via skill or direct connection string
- Test each one against a sample customer dataset
- Bundle as .md files in the repo at `/prompts/`

### Phase 3: Setup gids PDF (~5 hours)
- Write copy for both paths
- Take screenshots for each step (Mac + Windows)
- Record 3 Looms
- Design PDF in REVENU brand (Editor's Note H1/H2, burgundy accents, cream bg)
- Export, ready for download link in dashboard + post-purchase email

### Phase 4: Salespage + ManyChat + checkout (~5 hours)
- Salespage on `studio.revenu-academy.nl` (new subdomain)
- ManyChat flow for keyword **STUDIO**
- Plug&Pay checkout link
- Post-purchase email with download links + PDF

**Total build: ~27 hours. Realistic timeline: 1.5 weeks if other work continues alongside.**

---

## Sales mechanics

- **Keyword:** STUDIO (comment STUDIO under any content/IG bio link)
- **Salespage URL:** `studio.revenu-academy.nl`
- **Checkout:** Plug&Pay link, $47 one-time
- **Delivery:** post-purchase email with Vercel deploy button link, PDF download link, prompt pack download link
- **Support:** customer service via `hello@revenu-academy.nl`

---

## What this is NOT (scope guards)

To prevent scope creep, this product does NOT include:
- Auto-posting to Instagram (no Graph API)
- Background AI cron / autonomous learning
- 1:1 onboarding calls
- Custom integrations beyond Apify
- White-label or agency rights
- Lifetime updates (1 year of updates included, then optional upgrade)
- Live community or coaching access

Anything beyond this is a separate upsell or product.

---

## Locked decisions (2026-06-08)

- ✅ **Price:** $47 one-time
- ✅ **Product name:** Content Studio Dashboard
- ✅ **Branding:** REVENU classic burgundy + Editor's Note
- ✅ **Architecture:** One product, two routes in PDF (tech baddies + tech starters)
- ✅ **AI mode:** No autonomous loop, only Claude ↔ dashboard collaboration via prompts
- ✅ **Scraping:** Manual button + last-scraped timestamp, Apify free tier
- ✅ **No GitHub friction:** 1-click Vercel Deploy button for starters
- ✅ **No Meta Graph API** in v1 (klant post zelf vanuit Instagram)

## Final lock (Thessa 2026-06-08)

- ✅ **Keyword:** STUDIO
- ✅ **URL:** `studio.revenu-academy.nl`
- ✅ **Position:** standalone product + order bump optie op andere REVENU producten
- ✅ **Toegevoegd aan 2 Second YES offer suite** (zie `skills/2-second-yes/references/courses.md`)
- ✅ **Salespage framework:** authority-variant (Katie Coaching pattern)

✅ **Salespage skeleton (Thessa 2026-06-08):** **storytelling-variant**, anchored op de **biggest desire van de klant** waarom ze dit dashboard willen. Geen authority-variant voor v1 (geen 5+ klant-wins beschikbaar). Geen methode-talk in de hero — desire-first. Methode (dashboard tabs, 12 prompts, scrape button) mag pas verschijnen in HowItWorks / ValueStack secties.

**Customer-desire anchor (hypothesis, scherpstellen voor copy):**
> *"My content finally feels like an asset. Every caption sounds like ME, my brand has a system that learns from what works, and I stop spending 4 hours staring at a blank doc wondering if today's post will land."*

De storytelling boog (te schrijven in Phase 4):
- **Voor:** een goede ondernemer met goede content-instincten, maar haar Instagram voelt als een dagelijkse uitputtingsslag. Drafts overal verspreid. Geen idee welke posts écht verkopen. Captions die in ChatGPT als generieke AI-slop uitkomen. Elke maandagochtend dezelfde "wat post ik vandaag" knoop.
- **De kantelmomeent:** ze ontdekt dat Claude Code (haar AI die ze al heeft) haar hele content-brain kan zijn — als hij maar toegang had tot haar eigen data (pillars, voice, winners, competitors, drafts) op één plek.
- **Het na-beeld:** Claude kent haar voice. Kent haar winners. Schrijft in 5 minuten een caption die klinkt als zij, gebaseerd op wat al werkte. Haar content is een groeiend systeem, geen dagelijkse taak.

---

## Suggested next steps once locked

1. I write the salespage copy first (uses `salespage` skill + REVENU branding)
2. I scaffold the generic template repo (forked from `revenu-content-studio`)
3. I write the 12 prompts and test against REVENU's own data
4. We draft the PDF copy together, I generate screenshots/Looms
5. We do a soft launch to existing email list before public push
