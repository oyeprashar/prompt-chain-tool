-- Run AFTER 20261103_prompt_chains.sql in the Supabase SQL Editor.
-- Each row stores one execution and its ordered step outputs.
create table if not exists public.prompt_chain_runs (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  started_by uuid not null references auth.users(id),
  input_text text not null default '',
  input_image_name text,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  step_results jsonb not null default '[]'::jsonb,
  final_output text,
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists prompt_chain_runs_chain_created_idx
  on public.prompt_chain_runs(chain_id, created_at desc);

alter table public.prompt_chain_runs enable row level security;

drop policy if exists "Superadmins manage prompt chain runs" on public.prompt_chain_runs;
create policy "Superadmins manage prompt chain runs"
on public.prompt_chain_runs for all to authenticated
using ((select public.is_prompt_chain_admin()))
with check ((select public.is_prompt_chain_admin()));
