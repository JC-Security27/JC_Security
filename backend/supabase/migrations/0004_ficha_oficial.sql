-- ===========================================================================
-- JC Security — Ficha oficial del fabricante (2026-10-23)
--   products.description   ya existía: ahora trae las características oficiales
--                          traducidas, una por línea ("• ...")
--   products.source_url    página oficial de Tolsen de donde salen foto y ficha
--   products.official_name nombre oficial en inglés (referencia interna)
-- Se puede ejecutar varias veces.
-- ===========================================================================

alter table products add column if not exists source_url text;
alter table products add column if not exists official_name text;
