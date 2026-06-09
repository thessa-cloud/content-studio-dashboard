-- ─────────────────────────────────────────────────────────────────────────────
-- Content Studio Dashboard — initial schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Single-tenant product: one Supabase project per customer deploy. Every table
-- has RLS enabled with NO policies, so anonymous + authenticated requests are
-- blocked. Only the Next.js server (using SUPABASE_SERVICE_ROLE_KEY) can read
-- or write. That key bypasses RLS by design.
--
-- Run order: just paste the whole file into the Supabase SQL editor once, or
-- let the CLI (`supabase db push`) pick it up automatically.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. performance ──────────────────────────────────────────────────────────
-- One row per scrape of the user's own Instagram. Newest row is rendered on
-- the Performance tab. Old rows are kept so we can chart trend over time.
create table if not exists public.performance (
  id              uuid primary key default gen_random_uuid(),
  scraped_at      timestamptz not null default now(),
  followers       integer,
  avg_likes       integer,
  best_pillar     text,
  best_hook_type  text,
  top_posts       jsonb default '[]'::jsonb,
  pillar_mix      jsonb default '{}'::jsonb,
  hook_type_mix   jsonb default '{}'::jsonb
);

create index if not exists performance_scraped_at_idx
  on public.performance (scraped_at desc);

alter table public.performance enable row level security;

-- ── 2. strategy ─────────────────────────────────────────────────────────────
-- Pillars, voice rules, current campaigns, ICA notes. Treated as a singleton
-- in the UI (we read the newest row). Keeping history lets the user see how
-- their strategy evolved across months.
create table if not exists public.strategy (
  id          uuid primary key default gen_random_uuid(),
  updated_at  timestamptz not null default now(),
  pillars     jsonb default '[]'::jsonb,
  voice       jsonb default '{}'::jsonb,
  campaigns   jsonb default '[]'::jsonb,
  hooks       jsonb default '[]'::jsonb,
  ica_notes   text
);

-- Idempotent upgrade for installs that ran the v1 schema before `hooks` existed.
alter table public.strategy add column if not exists hooks jsonb default '[]'::jsonb;

create index if not exists strategy_updated_at_idx
  on public.strategy (updated_at desc);

alter table public.strategy enable row level security;

-- ── 3. drafts ───────────────────────────────────────────────────────────────
-- The caption writing workspace. Status flow: draft → scheduled → posted.
create table if not exists public.drafts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  caption         text not null,
  status          text not null default 'draft'
                  check (status in ('draft', 'scheduled', 'posted')),
  pillar          text,
  hook_type       text,
  -- A draft tags itself with at most one trigger word (the campaign keyword
  -- driving this post). The UI is a single text input; the column is singular
  -- to match. If we ever need multiple, migrate to text[] additively.
  trigger_word    text,
  slide_count     integer,
  format          text,
  scheduled_for   timestamptz,
  posted_at       timestamptz,
  posted_url      text,
  notes           text
);

create index if not exists drafts_created_at_idx
  on public.drafts (created_at desc);
create index if not exists drafts_status_idx
  on public.drafts (status);

-- Idempotent upgrade: pre-release installs ran with a `trigger_words text[]`
-- column. The UI never supported multiple values, so we converge on a single
-- `trigger_word text`. Backfills [0] then drops the old array column.
alter table public.drafts add column if not exists trigger_word text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'drafts'
       and column_name  = 'trigger_words'
  ) then
    update public.drafts
       set trigger_word = trigger_words[1]
     where trigger_word is null
       and array_length(trigger_words, 1) > 0;
    alter table public.drafts drop column trigger_words;
  end if;
end$$;

-- Auto-bump updated_at on edits so the UI can show a live "last edited" hint.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists drafts_touch_updated_at on public.drafts;
create trigger drafts_touch_updated_at
  before update on public.drafts
  for each row execute function public.touch_updated_at();

alter table public.drafts enable row level security;

-- ── 4. competitors ──────────────────────────────────────────────────────────
-- One row per (handle, scrape). The Intel tab reads the newest row per handle.
create table if not exists public.competitors (
  id                uuid primary key default gen_random_uuid(),
  handle            text not null,
  scraped_at        timestamptz not null default now(),
  top_posts         jsonb default '[]'::jsonb,
  trending_hooks    jsonb default '[]'::jsonb,
  trending_formats  jsonb default '{}'::jsonb,
  best_hook_type    text,
  best_format       text
);

create index if not exists competitors_handle_scraped_at_idx
  on public.competitors (handle, scraped_at desc);

alter table public.competitors enable row level security;

-- ── 5. library_posts ────────────────────────────────────────────────────────
-- The raw scrape feed — every post pulled from the user's account and every
-- competitor's account. Vault tab renders this directly.
create table if not exists public.library_posts (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,                  -- 'self' or '@handle'
  type          text,                            -- Reel | Carousel | Image
  posted_at     timestamptz,
  scraped_at    timestamptz not null default now(),
  hook          text,
  caption       text,
  likes         integer default 0,
  comments      integer default 0,
  views         integer,
  url           text,
  pillar        text,
  hook_type     text,
  raw           jsonb default '{}'::jsonb        -- escape hatch for fields we add later
);

create index if not exists library_posts_posted_at_idx
  on public.library_posts (posted_at desc);
create index if not exists library_posts_source_idx
  on public.library_posts (source);
create unique index if not exists library_posts_url_uniq
  on public.library_posts (url)
  where url is not null;

alter table public.library_posts enable row level security;

-- ── 6. scrape_log ───────────────────────────────────────────────────────────
-- Every scrape run leaves a row here. The TabHeader reads the newest entry
-- for the "Last scraped: X ago" timestamp.
create table if not exists public.scrape_log (
  id          uuid primary key default gen_random_uuid(),
  scraped_at  timestamptz not null default now(),
  mode        text,                              -- all | self | competitors
  status      text default 'success',            -- success | error
  duration_ms integer,
  notes       text
);

create index if not exists scrape_log_scraped_at_idx
  on public.scrape_log (scraped_at desc);

alter table public.scrape_log enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notes for the operator
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RLS is ON for every table with zero policies. This means anon + authed
--    role get nothing. Only service_role (used server-side from Next.js)
--    can read or write. If you ever want client-side reads, add a policy.
--
-- 2. All tables grow append-only by default. If your free tier fills up,
--    run a manual cleanup like:
--       delete from public.library_posts where scraped_at < now() - interval '90 days';
--
-- 3. The Edge Function `content-scraper` writes to performance, competitors,
--    library_posts, and scrape_log. The dashboard writes only to drafts +
--    strategy via the Next.js API.
-- ─────────────────────────────────────────────────────────────────────────────
