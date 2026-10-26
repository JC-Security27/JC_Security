-- ===========================================================================
-- JC Security — Disponibilidad según el proveedor (Intrade), 2026-10-26
-- Regla del negocio: solo se publica lo que Intrade tiene disponible.
--   products.available         lo actualiza backend/catalog/sync_intrade.py
--   products.available_checked fecha de la última verificación
-- Los no disponibles quedan ocultos al público (RLS), igual que los descontinuados.
-- Se puede ejecutar varias veces.
-- ===========================================================================

alter table products add column if not exists available boolean not null default true;
alter table products add column if not exists available_checked timestamptz;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select
  using (not discontinued and available);

drop policy if exists "public read product_images" on product_images;
create policy "public read product_images" on product_images for select
  using (exists (select 1 from products p where p.id = product_id and not p.discontinued and p.available));

create or replace view categories_with_count
with (security_invoker = true) as
select c.*, count(p.id)::int as product_count
from categories c
left join products p on p.category_slug = c.slug and not p.discontinued and p.available
group by c.id;

grant select on categories_with_count to anon, authenticated;

-- La búsqueda (sitio y asistente IA) también excluye los no disponibles.
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
    where not p.discontinued and p.available
  )
  select (s.p).*
  from scored s
  where s.total > 0 and (case when match_all then s.hits = s.total else s.hits > 0 end)
     or (s.p).reference ilike trim(q)
  order by ((s.p).reference ilike trim(q)) desc, s.hits desc, (s.p).reference
  limit greatest(1, least(max_results, 200));
$$;
