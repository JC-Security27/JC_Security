-- ===========================================================================
-- JC Security — Variantes de talla / medida (pedido de Kiro, 2026-10-23)
--   variant_group_id  igual para todas las tallas de un mismo artículo; null si no tiene
--   size_label        talla o medida limpia para el selector ("XL", "39", "7”")
-- Los calcula backend/catalog/assign_variants.py. Se puede ejecutar varias veces.
-- ===========================================================================

alter table products add column if not exists variant_group_id text;
alter table products add column if not exists size_label text;
create index if not exists products_variant_group_id_idx on products (variant_group_id);
