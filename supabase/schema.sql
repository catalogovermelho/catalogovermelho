-- Catálogo Vermelho: schema do Supabase (Postgres).
-- Rode no SQL Editor do projeto. Idempotente onde possível.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.empresas (
  id         bigint generated always as identity primary key,
  nome       text not null check (char_length(nome) between 2 and 80),
  instagram  text not null unique check (instagram ~ '^[a-z0-9._]{1,30}$'),
  categoria  text not null check (categoria in (
               'alimentacao', 'entretenimento', 'moda', 'saude-beleza', 'servicos', 'comercio',
               'educacao', 'tecnologia', 'casa-construcao', 'automotivo', 'pets', 'turismo', 'outros')),
  descricao  text check (char_length(descricao) <= 280),
  site       text check (site ~ '^https?://' and char_length(site) <= 500),
  uf         char(2) not null check (uf in (
               'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
               'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  cidade     text not null check (char_length(cidade) between 2 and 60),
  lat        double precision not null check (lat between -34 and 6),
  lng        double precision not null check (lng between -74 and -28),
  aprovado   boolean not null default false,
  busca      text not null default '',
  criado_em  timestamptz not null default now()
);

-- Migração: bancos criados com a coluna antiga `status` passam a usar `aprovado`.
alter table public.empresas add column if not exists aprovado boolean not null default false;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'empresas' and column_name = 'status') then
    update public.empresas set aprovado = (status = 'aprovado');
    alter table public.empresas drop column status cascade;
  end if;
end $$;

-- Texto de busca normalizado (minúsculo, sem acento), mesma regra de js/texto.js.
create or replace function public.empresas_preencher_busca()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.busca := lower(extensions.unaccent(concat_ws(' ', new.nome, new.instagram, new.descricao)));
  return new;
end $$;

drop trigger if exists empresas_busca on public.empresas;
create trigger empresas_busca before insert or update of nome, instagram, descricao
  on public.empresas for each row execute function public.empresas_preencher_busca();

create index if not exists empresas_filtros_idx
  on public.empresas (uf, cidade, categoria) where aprovado;
create index if not exists empresas_busca_trgm_idx
  on public.empresas using gin (busca extensions.gin_trgm_ops) where aprovado;

-- Segurança: o público só lê aprovadas (via buscar_empresas). Cadastro só pela
-- Edge Function `cadastrar`, que valida o captcha e usa a service role.
alter table public.empresas enable row level security;

drop policy if exists "leitura de aprovadas" on public.empresas;
create policy "leitura de aprovadas" on public.empresas
  for select to anon, authenticated using (aprovado);

drop policy if exists "cadastro pendente" on public.empresas;

revoke all on public.empresas from anon, authenticated;

-- Busca única: filtros + texto + ordenação por distância (haversine, sem PostGIS).
-- security definer para ler a tabela sem expor SELECT direto; o filtro de aprovação fica aqui.
create or replace function public.buscar_empresas(
  p_q         text default null,
  p_uf        text default null,
  p_cidade    text default null,
  p_categoria text default null,
  p_lat       double precision default null,
  p_lng       double precision default null,
  p_limite    int default 20,
  p_offset    int default 0
)
returns table (
  id bigint, nome text, instagram text, categoria text, descricao text, site text,
  uf text, cidade text, lat double precision, lng double precision, distancia_km double precision
)
language sql stable security definer set search_path = '' as $$
  with termo as (
    select '%' || replace(replace(replace(
             lower(extensions.unaccent(trim(p_q))), '\', '\\'), '%', '\%'), '_', '\_') || '%' as padrao
  )
  select e.id, e.nome, e.instagram, e.categoria, e.descricao, e.site,
         e.uf::text, e.cidade, e.lat, e.lng,
         case when p_lat is not null and p_lng is not null then
           12742 * asin(sqrt(
             power(sin(radians(e.lat - p_lat) / 2), 2)
             + cos(radians(p_lat)) * cos(radians(e.lat)) * power(sin(radians(e.lng - p_lng) / 2), 2)))
         end as distancia_km
  from public.empresas e, termo
  where e.aprovado
    and (p_uf is null or e.uf = p_uf)
    and (p_cidade is null or e.cidade = p_cidade)
    and (p_categoria is null or e.categoria = p_categoria)
    and (nullif(trim(p_q), '') is null or e.busca like termo.padrao)
  order by distancia_km nulls last, e.nome
  limit least(greatest(p_limite, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.buscar_empresas from public;
grant execute on function public.buscar_empresas to anon, authenticated;

-- Moderação: marque `aprovado` no Table Editor ou rode
--   update public.empresas set aprovado = true where id = <id>;
