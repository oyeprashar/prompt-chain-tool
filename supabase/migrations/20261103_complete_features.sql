-- Final-feature migration for the reused COMS6998 Supabase project.
-- Safe for existing rows; does not rename/drop legacy columns.
alter table public.prompt_chain_steps
  add column if not exists output_type text not null default 'text';
alter table public.prompt_chain_steps
  drop constraint if exists prompt_chain_steps_output_type_check;
alter table public.prompt_chain_steps
  add constraint prompt_chain_steps_output_type_check
  check (output_type in ('text', 'image'));

alter table public.prompt_chain_runs
  add column if not exists input_image_path text;

-- Private storage bucket for uploaded and AI-generated images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prompt-chain-media', 'prompt-chain-media', false, 10485760,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Prompt chain superadmin media read" on storage.objects;
create policy "Prompt chain superadmin media read" on storage.objects
for select to authenticated
using (bucket_id = 'prompt-chain-media'
       and (select public.is_prompt_chain_admin()));

drop policy if exists "Prompt chain superadmin media upload" on storage.objects;
create policy "Prompt chain superadmin media upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'prompt-chain-media'
            and (select public.is_prompt_chain_admin()));

drop policy if exists "Prompt chain superadmin media delete" on storage.objects;
create policy "Prompt chain superadmin media delete" on storage.objects
for delete to authenticated
using (bucket_id = 'prompt-chain-media'
       and (select public.is_prompt_chain_admin()));

-- Correct the old/new column alignment when steps are moved.
-- The existing table uses both step_number and position.
create or replace function public.move_prompt_step(p_step_id uuid, p_direction integer)
returns void language plpgsql security definer set search_path = ''
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
  -- Move through a temporary position so immediate UNIQUE constraints on
  -- (prompt_chain_id, step_number) or (chain_id, position) do not fail.
  update public.prompt_chain_steps
  set position = (select coalesce(max(position), 0) + 1
                  from public.prompt_chain_steps where chain_id = current_step.chain_id),
      step_number = (select coalesce(max(step_number), 0) + 1
                     from public.prompt_chain_steps where chain_id = current_step.chain_id)
  where id = current_step.id;

  update public.prompt_chain_steps
  set position = current_step.position,
      step_number = current_step.step_number
  where id = neighbor.id;

  update public.prompt_chain_steps
  set position = neighbor.position,
      step_number = neighbor.step_number
  where id = current_step.id;
end;
$$;

revoke all on function public.move_prompt_step(uuid, integer) from public;
grant execute on function public.move_prompt_step(uuid, integer) to authenticated;
notify pgrst, 'reload schema';
