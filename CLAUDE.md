@AGENTS.md

## Supabase migration template for new tables (mandatory)

Per Supabase 2026-05-30 / 2026-10-30 Data API change, every `CREATE TABLE` in `public` now requires explicit `GRANT` statements. Without them, the table is invisible to supabase-js / PostgREST / GraphQL. Use this exact boilerplate when adding any table:

```sql
create table public.your_table (
  id uuid primary key default gen_random_uuid(),
  -- user_id only if the table is per-user. For shared content-studio
  -- data (audience snapshots, scraped competitor data, etc.) leave it
  -- out and gate via service_role + policies that match your access
  -- pattern.
  -- user_id uuid references auth.users(id) on delete cascade,
  -- ... your columns ...
  created_at timestamptz not null default now()
);

-- Explicit grants (required from May 30, enforced everywhere Oct 30):
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;
-- only if anon needs read access (rare in content-studio):
-- grant select on public.your_table to anon;

-- RLS on + at least one policy (RLS without policies = locked table):
alter table public.your_table enable row level security;

-- Most content-studio tables are service-role-only. Add an explicit
-- policy for any user-facing read or write you need, e.g.:
-- create policy "your_table_read" on public.your_table
--   for select to authenticated using (auth.uid() = user_id);
```

If a grant is missing, PostgREST returns `42501` with the exact GRANT to add. Note: an event trigger (`public.rls_auto_enable`) already auto-enables RLS on every new public table, but you still need to add the policies yourself.
