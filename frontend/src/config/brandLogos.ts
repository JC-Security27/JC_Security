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
  dahua: "/brand-dahua.jpg",
  "brand-tolsen": "/brand-tolsen.jpg",
  tolsen: "/brand-tolsen.jpg",
};

/**
 * Color de fondo de la tarjeta por marca, para que combine con el fondo del
 * logo cuadrado y no se vean franjas (el logo va "contain", completo).
 */
const BRAND_BG: Record<string, string> = {
  "brand-tolsen": "#F7A823", // naranja Tolsen
  tolsen: "#F7A823",
  dahua: "#000000", // negro Dahua
};

/** Devuelve el color de fondo de la tarjeta para una marca (o null). */
export function getBrandBg(brand: Brand): string | null {
  return BRAND_BG[brand.id] ?? null;
}

/**
 * Catálogo COMPLETO de marcas que distribuye JC Security (opción B: se
 * muestran todas en el filtro aunque aún no tengan productos cargados; se van
 * "rellenando" a medida que el backend cargue sus productos). El id es un slug
 * estable; el backend debe usar el mismo id al crear la marca en Supabase.
 */
export const ALL_BRANDS: Brand[] = [
  { id: "ajax", name: "AJAX" },
  { id: "altronix", name: "ALTRONIX" },
  { id: "argos", name: "Argos" },
  { id: "cdp", name: "CDP" },
  { id: "cdvi", name: "CDVI" },
  { id: "dahua", name: "Dahua" },
  { id: "dexson", name: "Dexson" },
  { id: "dlx", name: "dlx" },
  { id: "eleksteel", name: "Eleksteel" },
  { id: "enforcer", name: "Enforcer" },
  { id: "firelite", name: "Firelite" },
  { id: "forza", name: "Forza" },
  { id: "general-electric", name: "General Electric" },
  { id: "gerfor", name: "Gerfor" },
  { id: "hagroy", name: "Hagroy" },
  { id: "imou", name: "IMOU" },
  { id: "keri-systems", name: "Keri Systems" },
  { id: "lantek", name: "Lantek" },
  { id: "mercusys", name: "Mercusys" },
  { id: "mircom", name: "MIRCOM" },
  { id: "optex", name: "Optex" },
  { id: "paradox", name: "PARADOX" },
  { id: "pkcell", name: "PKCELL" },
  { id: "poliflex", name: "Poliflex" },
  { id: "reyee", name: "Reyee" },
  { id: "sabo", name: "SABO" },
  { id: "sti", name: "STI" },
  { id: "tolsen", name: "TOLSEN" },
  { id: "tp-link", name: "TP Link" },
  { id: "trendnet", name: "TRENDnet" },
  { id: "western-digital", name: "Western Digital" },
  { id: "zkteco", name: "ZKTeco" },
];

/** Alias retro-compatible. */
export const DEMO_BRANDS = ALL_BRANDS;

/** Devuelve la URL del logo de una marca, o null si no hay.
 *  Si tenemos un logo local para esa marca, ese manda (son los logos
 *  rectangulares aprobados por el cliente, con las letras en el color
 *  correcto). Solo caemos al logoUrl del backend si no hay local. */
export function getBrandLogo(brand: Brand): string | null {
  return LOCAL_BRAND_LOGOS[brand.id] ?? brand.logoUrl ?? null;
}

/**
 * Fusiona el catálogo fijo de marcas (ALL_BRANDS) con las reales del backend.
 * - Se muestran TODAS las marcas fijas, en su orden (opción B).
 * - Si una marca ya vino del backend, se usan sus datos (incluye logoUrl y el
 *   nombre oficial), pero conservando la posición del listado fijo.
 * - Marcas del backend que no estén en el listado fijo se agregan al final.
 */
export function withDemoBrands(brands: Brand[]): Brand[] {
  const fromBackend = new Map(brands.map((b) => [b.id, b]));
  const fixedIds = new Set(ALL_BRANDS.map((b) => b.id));

  const merged: Brand[] = ALL_BRANDS.map(
    (fixed) => fromBackend.get(fixed.id) ?? fixed
  );
  // Agrega al final cualquier marca real que no esté en el listado fijo.
  for (const b of brands) {
    if (!fixedIds.has(b.id)) merged.push(b);
  }
  return merged;
}
