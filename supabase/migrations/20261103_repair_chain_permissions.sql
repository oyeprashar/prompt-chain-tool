-- Run in Supabase SQL Editor if creating chains fails.
-- This applies least-privilege table grants and reinstates the superadmin RLS policy.
-- It does not disable RLS, modify profiles, or remove existing data.

-- The helper was created by 20261103_prompt_chains.sql. If that migration
-- was skipped, run it FIRST; do not guess at missing schema.
do $$
begin
  if to_regprocedure('public.is_prompt_chain_admin()') is null then
    raise exception 'Run 20261103_prompt_chains.sql first: helper function is missing';
  end if;
end
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.prompt_chains to authenticated;
grant select, insert, update, delete on table public.prompt_chain_steps to authenticated;

alter table public.prompt_chains enable row level security;
alter table public.prompt_chain_steps enable row level security;

drop policy if exists "Superadmins manage prompt chains" on public.prompt_chains;
create policy "Superadmins manage prompt chains"
  on public.prompt_chains for all to authenticated
  using ((select public.is_prompt_chain_admin()))
  with check ((select public.is_prompt_chain_admin()));

drop policy if exists "Superadmins manage prompt steps" on public.prompt_chain_steps;
create policy "Superadmins manage prompt steps"
  on public.prompt_chain_steps for all to authenticated
  using ((select public.is_prompt_chain_admin()))
  with check ((select public.is_prompt_chain_admin()));

-- If creation still fails, check the logged PostgREST error code/message
-- and inspect the existing table schema for additional required columns.
