-- Run in the existing Supabase project's SQL Editor.
-- profiles(id uuid, is_superadmin boolean) must already exist.
create extension if not exists pgcrypto;

create table if not exists public.prompt_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 10000),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now()
);

create index if not exists prompt_chain_steps_chain_position_idx
  on public.prompt_chain_steps(chain_id, position);

-- Runs under the signed-in user's identity: no service-role secret in the app.
-- A SECURITY DEFINER function avoids needing a broad SELECT policy on profiles.
create or replace function public.is_prompt_chain_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_superadmin is true
  );
$$;
revoke all on function public.is_prompt_chain_admin() from public;
grant execute on function public.is_prompt_chain_admin() to authenticated;

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

-- Atomic swap for the up/down buttons, serialized per chain.
create or replace function public.move_prompt_step(p_step_id uuid, p_direction integer)
returns void language plpgsql security definer
set search_path = ''
as $$
declare
  current_step public.prompt_chain_steps%rowtype;
  neighbor public.prompt_chain_steps%rowtype;
begin
  if (select auth.uid()) is null or not (select public.is_prompt_chain_admin()) then
    raise exception 'Not authorized';
  end if;
  if p_direction not in (-1, 1) then
    raise exception 'Direction must be -1 or 1';
  end if;

  select * into current_step from public.prompt_chain_steps where id = p_step_id;
  if not found then raise exception 'Step not found'; end if;

  -- Lock the parent so concurrent reorders in the same chain cannot interleave.
  perform 1 from public.prompt_chains where id = current_step.chain_id for update;
  select * into current_step from public.prompt_chain_steps where id = p_step_id;

  if p_direction = -1 then
    select * into neighbor from public.prompt_chain_steps
    where chain_id = current_step.chain_id
      and (position, id) < (current_step.position, current_step.id)
    order by position desc, id desc limit 1;
  else
    select * into neighbor from public.prompt_chain_steps
    where chain_id = current_step.chain_id
      and (position, id) > (current_step.position, current_step.id)
    order by position asc, id asc limit 1;
  end if;

  if not found then return; end if;

  update public.prompt_chain_steps
  set position = case
    when id = current_step.id then neighbor.position
    else current_step.position
  end
  where id in (current_step.id, neighbor.id);
end;
$$;
revoke all on function public.move_prompt_step(uuid, integer) from public;
grant execute on function public.move_prompt_step(uuid, integer) to authenticated;
