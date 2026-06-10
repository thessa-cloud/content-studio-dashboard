-- ─────────────────────────────────────────────────────────────────────────────
-- Content Studio Dashboard — Legacy Vault
-- ─────────────────────────────────────────────────────────────────────────────
-- Mark winner content (reels, carousels, stories, images) as "legacy" so it can
-- be filtered separately AND optionally auto-recycled into the drafts queue.
--
-- Source-polymorphism: a legacy piece can point to a library_posts row (Vault
-- feed), a drafts row (own posted draft), or be standalone (manually entered
-- story that Apify doesn't scrape).
--
-- Auto-recycle V2: when recycle_status='active' AND interval elapsed, the
-- legacy-recycle Edge Function clones the legacy piece into the drafts table
-- with status='draft'. No auto-schedule, no auto-post. Thessa always reviews.
-- The Edge Function is invoked on-demand from a dashboard button — no pg_cron.
--
-- Conventions match 0001: text + check constraint (no CREATE TYPE), RLS on
-- without policies (only service_role accesses via Next.js API), idempotent
-- `create table if not exists`.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.legacy_pieces (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Source (polymorphic, app-level FK)
  source_type           text not null
                        check (source_type in ('library_post', 'draft', 'standalone')),
  -- nullable: NULL when source_type='standalone'
  source_id             uuid,

  -- Denormalized snapshot — legacy row survives if source is deleted/rescraped
  type                  text not null
                        check (type in ('reel', 'carousel', 'story', 'image')),
  hook                  text,
  caption               text,
  posted_at             timestamptz,
  thumb_url             text,
  performance_note      text,

  -- Auto-recycle config
  recycle_status        text not null default 'paused'
                        check (recycle_status in ('paused', 'active')),
  recycle_interval_days integer not null default 28,
  last_recycled_at      timestamptz,
  recycle_count         integer not null default 0,

  -- Polymorphic FK integrity (app-level — no FK to two tables possible)
  constraint legacy_source_id_check check (
    (source_type = 'standalone' and source_id is null)
    or (source_type in ('library_post', 'draft') and source_id is not null)
  )
);

create index if not exists legacy_pieces_recycle_status_idx
  on public.legacy_pieces (recycle_status, last_recycled_at);

create index if not exists legacy_pieces_type_idx
  on public.legacy_pieces (type);

create index if not exists legacy_pieces_source_idx
  on public.legacy_pieces (source_type, source_id);

-- One legacy row per (source_type, source_id) for referenced rows. Closes
-- the TOCTOU race in POST /api/legacy where two near-simultaneous "Mark as
-- legacy" clicks on the same library_post / draft could both pass the
-- pre-insert dedup check and create twin rows. Partial WHERE excludes
-- standalone (source_id NULL, no upstream to be a duplicate of).
create unique index if not exists legacy_pieces_unique_source_idx
  on public.legacy_pieces (source_type, source_id)
  where source_id is not null;

create index if not exists legacy_pieces_created_at_idx
  on public.legacy_pieces (created_at desc);

-- Reuse the touch_updated_at trigger function defined in 0001_initial_schema.sql
drop trigger if exists legacy_pieces_touch_updated_at on public.legacy_pieces;
create trigger legacy_pieces_touch_updated_at
  before update on public.legacy_pieces
  for each row execute function public.touch_updated_at();

alter table public.legacy_pieces enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notes for the operator
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RLS is ON with NO policies — only service_role (Next.js API) can access.
--
-- 2. Source-polymorphism: there is no DB-level FK on source_id (it can point
--    to library_posts.id OR drafts.id depending on source_type). Denormalized
--    hook/caption/posted_at/type ensure the legacy row survives even if the
--    source row is deleted.
--
-- 3. To find all legacy library_posts:
--      select * from library_posts lp
--      join legacy_pieces l on l.source_type = 'library_post'
--                          and l.source_id = lp.id;
--
-- 4. Recycle scan (run by Edge Function `legacy-recycle`, NOT pg_cron):
--      select * from legacy_pieces
--       where recycle_status = 'active'
--         and (last_recycled_at is null
--              or now() - last_recycled_at >= make_interval(days => recycle_interval_days))
--       for update skip locked;
-- ─────────────────────────────────────────────────────────────────────────────
