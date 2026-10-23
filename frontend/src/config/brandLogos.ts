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

/** Devuelve la URL del logo de una marca, o null si no hay. */
export function getBrandLogo(brand: Brand): string | null {
  if (brand.logoUrl) return brand.logoUrl; // backend tiene prioridad
  return LOCAL_BRAND_LOGOS[brand.id] ?? null;
}
