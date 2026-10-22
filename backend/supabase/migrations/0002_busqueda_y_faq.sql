-- ===========================================================================
-- JC Security — Búsqueda sin tildes + preguntas frecuentes del asistente IA
--   normalize_es()       minúsculas y sin tildes ("MEDICIÓN" -> "medicion")
--   products.search_text referencia + nombre + specs, normalizado
--   search_products()    búsqueda para el sitio y para el asistente IA
--   faq                  respuestas oficiales que el asistente puede usar
-- Se puede ejecutar varias veces.
-- ===========================================================================

create or replace function normalize_es(t text) returns text
language sql immutable parallel safe as $$
  select translate(lower(coalesce(t, '')), 'áéíóúüñàèìòù', 'aeiouunaeiou')
$$;

alter table products add column if not exists search_text text
  generated always as (normalize_es(reference || ' ' || name || ' ' || specs::text)) stored;

-- Busca productos visibles. Cada palabra se compara sin tildes y sin la "s" final
-- ("alicates" encuentra "ALICATE"). match_all = true exige todas las palabras
-- (buscador del sitio); false ordena por cuántas coinciden (asistente IA).
create or replace function search_products(q text, match_all boolean default true, max_results int default 50)
returns setof products
language sql stable
set search_path = public as $$
  with words as (
    select distinct case when length(w) > 4 then regexp_replace(w, 'e?s$', '') else w end as w
    from unnest(regexp_split_to_array(normalize_es(q), '[^a-z0-9./-]+')) as w
    where (length(w) >= 3 or w ~ '\d')
      and w <> all (array['una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'con', 'sin', 'para', 'por',
                          'que', 'como', 'cual', 'cuales', 'hay', 'tiene', 'tienen', 'tienes', 'necesito',
                          'quiero', 'busco', 'venden', 'vende', 'precio', 'cuanto', 'cuesta', 'hola',
                          'gracias', 'favor', 'algun', 'alguna', 'esta', 'este', 'eso', 'esto', 'mas'])
  ),
  scored as (
    select p, (select count(*) from words where p.search_text like '%' || words.w || '%') as hits,
           (select count(*) from words) as total
    from products p
    where not p.discontinued
  )
  select (s.p).*
  from scored s
  where s.total > 0 and (case when match_all then s.hits = s.total else s.hits > 0 end)
     or (s.p).reference ilike trim(q)
  order by ((s.p).reference ilike trim(q)) desc, s.hits desc, (s.p).reference
  limit greatest(1, least(max_results, 200));
$$;

grant execute on function search_products(text, boolean, int) to anon, authenticated;
grant execute on function normalize_es(text) to anon, authenticated;

create table if not exists faq (
  id bigint generated always as identity primary key,
  question text not null,
  answer text not null,
  approved boolean not null default false, -- solo las aprobadas por JC Security llegan al asistente
  position int not null default 0,
  updated_at timestamptz not null default now()
);

alter table faq enable row level security;
drop policy if exists "public read approved faq" on faq;
create policy "public read approved faq" on faq for select using (approved);
grant select on faq to anon, authenticated;
