-- Modo ensaio do Por Um Fio.
-- Ligar: tira uma "foto" das fichas, mapas, peças e bichinhos.
-- Desligar: restaura a foto (fichas de monstro e notas ficam como estão).
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez sem problema.

create table if not exists public.rehearsals (
  id bigint generated always as identity primary key,
  active boolean not null default true,
  started_at timestamptz not null default now(),
  started_by uuid,
  ended_at timestamptz,
  snapshot jsonb not null
);
alter table public.rehearsals enable row level security;
drop policy if exists rehearsals_gm_read on public.rehearsals;
create policy rehearsals_gm_read on public.rehearsals for select to authenticated using (public.is_gm());
create unique index if not exists rehearsals_one_active on public.rehearsals (active) where active;

create or replace function public.start_rehearsal() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gm() then raise exception 'só o mestre pode ligar o ensaio'; end if;
  if exists (select 1 from public.rehearsals where active) then raise exception 'o ensaio já está ligado'; end if;
  insert into public.rehearsals (started_by, snapshot) values (auth.uid(), jsonb_build_object(
    'characters', coalesce((select jsonb_agg(to_jsonb(c)) from public.characters c), '[]'::jsonb),
    'scenes', coalesce((select jsonb_agg(to_jsonb(s)) from public.scenes s), '[]'::jsonb),
    'tokens', coalesce((select jsonb_agg(to_jsonb(t)) from public.tokens t), '[]'::jsonb),
    'pets', coalesce((select jsonb_agg(to_jsonb(p)) from public.pets p), '[]'::jsonb)
  ));
  insert into public.app_settings (key, value, updated_at)
  values ('ensaio', jsonb_build_object('active', true, 'started_at', now(), 'by', (select display_name from public.profiles where user_id = auth.uid())), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function public.end_rehearsal() returns void
language plpgsql security definer set search_path = public as $$
declare snap jsonb; rid bigint;
begin
  if not public.is_gm() then raise exception 'só o mestre pode desligar o ensaio'; end if;
  select id, snapshot into rid, snap from public.rehearsals where active;
  if rid is null then raise exception 'nenhum ensaio ligado'; end if;

  -- fichas voltam ao que eram; personagens criados durante o ensaio saem
  update public.characters c set data = x.data, updated_at = now()
    from jsonb_populate_recordset(null::public.characters, snap->'characters') x where c.id = x.id;
  delete from public.characters where id not in (select x->>'id' from jsonb_array_elements(snap->'characters') x);

  -- mapas e peças voltam ao que eram
  delete from public.tokens where true;
  delete from public.scenes where id not in (select (x->>'id')::uuid from jsonb_array_elements(snap->'scenes') x);
  insert into public.scenes select * from jsonb_populate_recordset(null::public.scenes, snap->'scenes')
    on conflict (id) do update set name = excluded.name, image = excluded.image, grid = excluded.grid,
      off_x = excluded.off_x, off_y = excluded.off_y, active = excluded.active;
  insert into public.tokens select * from jsonb_populate_recordset(null::public.tokens, snap->'tokens')
    where scene_id in (select id from public.scenes)
      and (bestiary_id is null or bestiary_id in (select id from public.bestiary));

  -- bichinhos voltam ao que eram
  update public.pets p set mood = x.mood, hunger = x.hunger, energy = x.energy, sleeping = x.sleeping,
         pats = x.pats, last_pat_by = x.last_pat_by, updated_at = x.updated_at
    from jsonb_populate_recordset(null::public.pets, snap->'pets') x where p.character_id = x.character_id;

  update public.rehearsals set active = false, ended_at = now() where id = rid;
  update public.app_settings set value = jsonb_build_object('active', false), updated_at = now() where key = 'ensaio';
end $$;

revoke all on function public.start_rehearsal(), public.end_rehearsal() from public, anon;
grant execute on function public.start_rehearsal(), public.end_rehearsal() to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.app_settings;
exception when duplicate_object then null; end $$;
