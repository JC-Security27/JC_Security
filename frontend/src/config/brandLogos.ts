/* ==========================================================================
   Logos de marca.
   -------------------------------------------------------------------------
   Lo ideal es que cada marca traiga su `logoUrl` desde el backend
   (brands.logo_url en Supabase). Mientras eso se carga, mantenemos aquí un
   mapa local por id de marca para la demo. Si el backend provee logoUrl, ese
   tiene prioridad.
   ========================================================================== */

import type { Brand } from "@/types/catalog";

/** Logos locales por id de marca (en frontend/public). */
const LOCAL_BRAND_LOGOS: Record<string, string> = {
  dahua: "/brand-dahua.svg",
  // tolsen: "/brand-tolsen.svg", // pendiente: falta el logo oficial de Tolsen
};

/**
 * Marcas que mostramos en el selector como ejemplo aunque aún no tengan
 * productos cargados en el backend. TEMPORAL: quitar cuando Claude cargue la
 * marca y sus productos en Supabase (entonces vendrá sola en getBrands()).
 */
export const DEMO_BRANDS: Brand[] = [
  { id: "dahua", name: "Dahua" },
];

/** Devuelve la URL del logo de una marca, o null si no hay. */
export function getBrandLogo(brand: Brand): string | null {
  if (brand.logoUrl) return brand.logoUrl; // backend tiene prioridad
  return LOCAL_BRAND_LOGOS[brand.id] ?? null;
}

/**
 * Fusiona las marcas reales del backend con las de ejemplo (DEMO_BRANDS),
 * sin duplicar las que ya existan.
 */
export function withDemoBrands(brands: Brand[]): Brand[] {
  const ids = new Set(brands.map((b) => b.id));
  const extra = DEMO_BRANDS.filter((b) => !ids.has(b.id));
  return [...brands, ...extra];
}
