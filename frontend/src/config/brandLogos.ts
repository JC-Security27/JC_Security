/* ==========================================================================
   Logos de marca.
   -------------------------------------------------------------------------
   Lo ideal es que cada marca traiga su `logoUrl` desde el backend
   (brands.logo_url en Supabase). Mientras eso se carga, mantenemos aquí un
   mapa local por id de marca para la demo. Si el backend provee logoUrl, ese
   tiene prioridad.
   ========================================================================== */

import type { Brand } from "@/types/catalog";

/** Logos locales por id de marca (en frontend/public). Logos cuadrados con
    su propio fondo, para que llenen toda la tarjeta. */
const LOCAL_BRAND_LOGOS: Record<string, string> = {
  dahua: "/brand-dahua-sq.jpg",
  "brand-tolsen": "/brand-tolsen.webp",
  tolsen: "/brand-tolsen.webp",
};

/**
 * Cómo ajustar el logo dentro de la tarjeta:
 * - "cover": el logo llena toda la tarjeta (logos cuadrados con su propio
 *   fondo, como Tolsen naranja o Dahua negro).
 * - "contain": el logo se ve completo centrado (logos transparentes).
 */
const BRAND_LOGO_FIT: Record<string, "cover" | "contain"> = {
  "brand-tolsen": "cover",
  tolsen: "cover",
  dahua: "cover",
};

/** Modo de ajuste del logo para una marca. */
export function getBrandLogoFit(brand: Brand): "cover" | "contain" {
  return BRAND_LOGO_FIT[brand.id] ?? "contain";
}

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
