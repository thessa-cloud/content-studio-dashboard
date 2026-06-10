# Content Studio Dashboard

Your personal content intelligence dashboard. Scrape your Instagram, learn what works, draft captions in your voice, all powered by Claude Code.

## What you get

Six tabs, one workspace:

- **Drafts**, caption writer with status (draft / scheduled / posted), trigger word tagger, slide count
- **Strategy**, your content pillars, voice rules, ICA notes, current campaigns (filled by Claude)
- **Performance**, your top posts, hooks, topics, sorted by engagement
- **Intel**, up to 5 competitor handles, their top hooks and patterns
- **Vault**, the raw scrape data, searchable, filterable, the source Claude reads
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fthessa-cloud%2Fcontent-studio-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,FUNCTION_SECRET&envDescription=Supabase%20project%20URL,%20service%20role%20key,%20and%20a%20random%20string%20for%20the%20scraper%20function.&project-name=content-studio&repository-name=content-studio)

1. **Click Deploy.** Vercel clones the template into your own account.
2. **Create a Supabase project** (free tier is fine) and paste `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into Vercel env vars.
3. **Run the migration.** In Supabase → SQL Editor, paste the contents of `supabase/migrations/0001_initial_schema.sql` and Run. Six tables appear.
4. **Set a `FUNCTION_SECRET`.** Any long random string. Use the same value inside the `content-scraper` Edge Function as its bearer-token check.
5. **Open the dashboard** and start with the Strategy tab. Click **Get pillars from Claude**, it copies a self-contained prompt with your latest scrape baked in and opens claude.ai. Paste, wait, paste the JSON reply back into the editor.
6. Repeat for Voice rules + Hooks. Your patterns appear on every tab.

Full step-by-step guide (with screenshots) is in `Setup Guide.pdf`.

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

## How Claude fits in

Every tab that needs Claude has its own button. Click → the dashboard copies
a self-contained prompt to your clipboard (with your freshest data already
baked in) and opens claude.ai in a new tab. Paste → wait → copy Claude's
reply → paste it back into the editor on the dashboard.

No CLI, no `/prompts/X.md` to memorise, no Claude Code subscription required
for this loop (any claude.ai login works).

| Tab | What Claude does |
|---|---|
| Strategy | Extracts your content pillars, voice rules, and hook library from your scrape |
| Drafts | Writes 3 caption options in your voice for a given topic |
| Performance | Surfaces top hooks, topics, and formats from your top posts |
| Intel | Pulls top hooks + format mix from each competitor handle |

## Tech stack

- Next.js 16.2.4 (Turbopack)
- React 19.2.4
- Supabase (Postgres + Auth)
- Apify (Instagram scraper)
- Claude Code (the AI runtime, runs on your laptop)

## License

For your personal use only. Reselling or redistributing the template is not allowed. See `LICENSE.md`.
