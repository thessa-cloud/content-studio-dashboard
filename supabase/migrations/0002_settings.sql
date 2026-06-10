-- ─────────────────────────────────────────────────────────────────────────────
-- Content Studio Dashboard — settings table (singleton)
-- ─────────────────────────────────────────────────────────────────────────────
-- Live, editable copy of the values that used to live ONLY in config.json:
--   - brand_name, instagram_handle
--   - competitors (text[] of handles, max 5 enforced in the UI)
--   - trigger_words: jsonb array of { word, offer, topic, promise }
--
-- Resolution order at runtime (lib/settings.ts):
--   1. row in this table, when present
--   2. config.json fallback (for fresh deploys / pre-edit state)
--
-- Customers no longer have to "ask Claude Code to update config.json", every
-- field is a form in the Settings tab. Writes go through /api/data?tab=settings
-- which uses the SERVICE_ROLE key — RLS stays denied for anon/auth like every
-- other table.
-- ─────────────────────────────────────────────────────────────────────────────

-- Self-contained: define touch_updated_at again in case this migration is run
-- on a database that hasn't seen 0001 yet. CREATE OR REPLACE is idempotent.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.settings (
  id                 uuid primary key default gen_random_uuid(),
  -- Singleton enforcement: at most one row. The UI hardcodes singleton=true on
  -- insert; the unique constraint guarantees a second insert fails noisily
  -- instead of silently splitting state across rows.
  singleton          boolean not null default true,
  brand_name         text,
  instagram_handle   text,
  competitors        text[]      default '{}'::text[],
  -- trigger_words is a jsonb array of objects shaped like:
  --   [{ "word": "STUDIO", "offer": "...", "topic": "...", "promise": "..." }]
  -- We keep it as jsonb (not a child table) because:
  --   a) The full list is always read together with the rest of settings.
  --   b) UI edits replace the whole array atomically — no per-row ordering needed.
  --   c) Backwards compat: a customer might still have ["STUDIO","BUNDLE"] in
  --      config.json. lib/settings.ts normalizes both shapes on read.
  trigger_words      jsonb       default '[]'::jsonb,
  updated_at         timestamptz not null default now(),
  constraint settings_singleton_uniq unique (singleton)
);

-- Touch updated_at on edits so the UI can show "last saved X ago".
drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

alter table public.settings enable row level security;
