-- ===========================================================================
-- JC Security — Catálogo (Supabase / Opción A)
-- Basado en comunicacion/adjuntos/API_CONTRACT.md (Kiro).
-- Cambios respecto al contrato, todos opcionales para el frontend:
--   categories.parent_slug  agrupa subcategorías (las 11 del PDF Tolsen van bajo "herramientas")
--   categories.position     orden de aparición
--   products.is_new         el PDF marca el producto con el sello "NUEVO"
--   products.discontinued   marcado EoL en el PDF; no es visible para el público
--   products.source_page    página del catálogo de donde salió el dato
-- Lectura pública por RLS; la escritura solo con la service role key (bypassa RLS).
-- Se puede ejecutar varias veces.
-- ===========================================================================

create table if not exists brands (
  id text primary key,
  name text not null,
  logo_url text
);

create table if not exists categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  parent_slug text,
  position int not null default 0
);

create table if not exists products (
  id text primary key,
  reference text not null,
  name text not null,
  category_slug text not null references categories(slug) on update cascade,
  brand_id text references brands(id),
  description text,
  specs jsonb not null default '{}'::jsonb,
  is_service boolean not null default false,
  is_new boolean not null default false,
  discontinued boolean not null default false,
  source_page int,
  updated_at timestamptz not null default now()
);
create index if not exists products_category_slug_idx on products (category_slug);
create index if not exists products_reference_idx on products (reference);
create index if not exists products_brand_id_idx on products (brand_id);

create table if not exists product_images (
  id bigint generated always as identity primary key,
  product_id text not null references products(id) on delete cascade,
  url text not null,
  alt text not null,
  width int,
  height int,
  needs_review boolean not null default false,
  position int not null default 0,
  unique (product_id, position)
);

-- Conteo de productos visibles por categoría (Category.productCount).
create or replace view categories_with_count
with (security_invoker = true) as
select c.*, count(p.id)::int as product_count
from categories c
left join products p on p.category_slug = c.slug and not p.discontinued
group by c.id;

-- RLS: lectura pública, sin escritura para anon/authenticated.
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

drop policy if exists "public read brands" on brands;
create policy "public read brands" on brands for select using (true);

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (not discontinued);

drop policy if exists "public read product_images" on product_images;
create policy "public read product_images" on product_images for select
  using (exists (select 1 from products p where p.id = product_id and not p.discontinued));

grant select on brands, categories, products, product_images, categories_with_count to anon, authenticated;

-- Bucket público para las fotos del catálogo.
insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do update set public = true;
