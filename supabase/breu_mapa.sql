-- Breu: mapa compartilhado (cenas, peças, escuro, círculos). Rodar uma vez no SQL Editor do Supabase.
create table if not exists public.breu_cenas (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Cena',
  img text,
  aspecto real not null default 0.6667,
  largura real not null default 30,
  fog jsonb not null default '{"on": true, "revela": []}'::jsonb,
  rodada int not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.breu_tokens (
  id uuid primary key default gen_random_uuid(),
  cena_id uuid not null references public.breu_cenas(id) on delete cascade,
  kind text not null check (kind in ('pc','npc','assombro','circulo')),
  character_id uuid references public.breu_characters(id) on delete cascade,
  owner uuid,
  nome text not null default '',
  img text,
  x real not null default 0.5, y real not null default 0.5,
  ax real not null default 0.5, ay real not null default 0.5,
  passos real not null default 6,
  visivel boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists breu_tokens_cena on public.breu_tokens(cena_id);
alter table public.breu_cenas enable row level security;
alter table public.breu_tokens enable row level security;

create policy breu_cenas_sel on public.breu_cenas for select using (public.breu_role() is not null);
create policy breu_cenas_gm on public.breu_cenas for all using (public.breu_role() in ('gm','admin')) with check (public.breu_role() in ('gm','admin'));

create policy breu_tokens_sel on public.breu_tokens for select using (
  public.breu_role() in ('gm','admin') or (public.breu_role() is not null and (visivel or owner = auth.uid())));
create policy breu_tokens_ins on public.breu_tokens for insert with check (
  public.breu_role() in ('gm','admin') or (public.breu_role() is not null and owner = auth.uid() and kind in ('pc','circulo') and visivel));
create policy breu_tokens_upd on public.breu_tokens for update using (
  public.breu_role() in ('gm','admin') or owner = auth.uid()) with check (
  public.breu_role() in ('gm','admin') or owner = auth.uid());
create policy breu_tokens_del on public.breu_tokens for delete using (
  public.breu_role() in ('gm','admin') or (owner = auth.uid() and kind = 'circulo'));

-- jogador só anda até o limite de passos da rodada e não mexe em âncora, passos, visibilidade ou dono
create or replace function public.breu_token_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare c record; dist real;
begin
  if public.breu_role() in ('gm','admin') or auth.uid() is null then
    new.updated_at := now(); return new;
  end if;
  if tg_op = 'INSERT' then
    if new.kind = 'pc' then new.ax := new.x; new.ay := new.y; new.passos := 6; end if;
    return new;
  end if;
  new.ax := old.ax; new.ay := old.ay; new.passos := old.passos; new.visivel := old.visivel;
  new.owner := old.owner; new.kind := old.kind; new.cena_id := old.cena_id; new.character_id := old.character_id;
  if new.kind = 'pc' then
    select largura, aspecto into c from public.breu_cenas where id = new.cena_id;
    dist := sqrt(power(new.x - new.ax, 2) + power((new.y - new.ay) * c.aspecto, 2)) * c.largura;
    if dist > new.passos + 0.15 then
      raise exception 'Fora do alcance desta rodada';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists breu_token_guard on public.breu_tokens;
create trigger breu_token_guard before insert or update on public.breu_tokens for each row execute function public.breu_token_guard();

alter table public.breu_tokens replica identity full;
alter publication supabase_realtime add table public.breu_cenas;
alter publication supabase_realtime add table public.breu_tokens;

insert into storage.buckets (id, name, public) values ('breu', 'breu', true) on conflict (id) do nothing;
create policy breu_storage_gm_ins on storage.objects for insert to authenticated with check (bucket_id = 'breu' and public.breu_role() in ('gm','admin'));
create policy breu_storage_gm_upd on storage.objects for update to authenticated using (bucket_id = 'breu' and public.breu_role() in ('gm','admin'));
create policy breu_storage_gm_del on storage.objects for delete to authenticated using (bucket_id = 'breu' and public.breu_role() in ('gm','admin'));
