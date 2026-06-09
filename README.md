# Content Studio Dashboard

Your personal content intelligence dashboard. Scrape your Instagram, learn what works, draft captions in your voice, all powered by Claude Code.

## What you get

Six tabs, one workspace:

- **Drafts**, caption writer with status (draft / scheduled / posted), trigger word tagger, slide count
- **Strategy**, your content pillars, voice rules, ICA notes, current campaigns (filled by Claude)
- **Performance**, your top posts, hooks, topics, sorted by engagement
- **Intel**, up to 5 competitor handles, their top hooks and patterns
- **Library**, the raw scrape data, searchable, filterable, the source Claude reads
- **Settings**, brand name, Apify token, theme color, competitors, trigger words

Plus a `[Scrape now]` button + `Last scraped: X hours ago` timestamp on every page.

## What you need

| Item | Cost | Notes |
|---|---|---|
| Vercel hobby plan | Free | Hosts the dashboard |
| Supabase free tier | Free | Stores your data |
| Apify free tier | Free | $5/mo credit, ~3 scrapes |
| Claude Code subscription | $20/month | Powers all the AI work, no API key needed |

**Total ongoing cost: $0** if you already have Claude Code.

## Setup

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_GITHUB%2Fcontent-studio-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,FUNCTION_SECRET&envDescription=Supabase%20project%20URL,%20service%20role%20key,%20and%20a%20random%20string%20for%20the%20scraper%20function.&project-name=content-studio&repository-name=content-studio)

1. **Click Deploy.** Vercel clones the template into your own account.
2. **Create a Supabase project** (free tier is fine) and paste `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into Vercel env vars.
3. **Run the migration.** In Supabase → SQL Editor, paste the contents of `supabase/migrations/0001_initial_schema.sql` and Run. Six tables appear.
4. **Set a `FUNCTION_SECRET`.** Any long random string. Use the same value inside the `content-scraper` Edge Function as its bearer-token check.
5. **Open the project in Claude Code** and paste the first prompt from `/prompts/1-extract-pillars.md`.
6. Refresh the dashboard, your patterns appear.

Full step-by-step guide (with screenshots) is in `Setup Guide.pdf`.

> The Vercel Deploy button URL above contains a placeholder `YOUR_GITHUB`. Replace it with your own GitHub username/org once you fork the repo, or fill in the full URL after publishing.

## Configure your brand

Edit `config.json` once after deploy. Or ask Claude Code to do it for you.

```json
{
  "brandName": "Your Brand",
  "instagramHandle": "your_handle",
  "competitors": ["@handle1", "@handle2"],
  "triggerWords": ["BUNDLE", "WAITLIST"]
}
```

## Prompt pack

12 ready-to-paste prompts live in `/prompts/`. Each one reads your data and writes patterns back to the dashboard.

| Prompt | What it does |
|---|---|
| `1-extract-pillars.md` | Reads 30 latest posts, extracts your content pillars |
| `2-extract-voice.md` | Extracts your voice rules from top 20 captions |
| `3-analyze-winners.md` | Surfaces your top 10 hooks, topics, formats |
| `4-competitor-patterns.md` | Top hooks of your competitors |
| `5-draft-caption.md` | Writes a caption in your voice for a given topic |
| `6-rewrite-caption.md` | Improves an existing draft using your winners |
| `7-weekly-review.md` | Reviews past week, updates Strategy |
| `8-find-content-gaps.md` | What pillars are underused |
| `9-build-content-week.md` | Drafts 5 to 7 captions for the week |
| `10-hook-library.md` | Builds your personal hook library |
| `11-objection-library.md` | Extracts FAQ from comments |
| `12-monthly-evolution.md` | Big-picture monthly review |

## Tech stack

- Next.js 16.2.4 (Turbopack)
- React 19.2.4
- Supabase (Postgres + Auth)
- Apify (Instagram scraper)
- Claude Code (the AI runtime, runs on your laptop)

## License

For your personal use only. Reselling or redistributing the template is not allowed. See `LICENSE.md`.
