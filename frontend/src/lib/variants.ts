/* ==========================================================================
   Agrupación de variantes por tamaño/talla.
   -------------------------------------------------------------------------
   Varios productos que son EL MISMO artículo en distinto tamaño (ej. un
   alicate en 7" y 8", o un zapato en varias tallas) vienen como productos
   separados, cada uno con su `reference` y su `specs.Presentación`.
   Aquí los agrupamos en un solo "grupo de variantes" para mostrar una sola
   tarjeta y, en el detalle, un desplegable de tallas con su referencia.

   Criterio CONSERVADOR (enfoque A, por frontend):
   - Mismo `name` (normalizado) + misma `categorySlug` + misma marca (`brandId`).
   - Más de un producto en el grupo.
   - Las variantes se distinguen por su `Presentación` (o la primera spec).
   Si cambia forma, color o funcionalidad (nombre distinto), NO se agrupan.
   Pendiente: cuando el backend exponga un `variant_group_id`, se usará ese
   en vez de esta heurística por texto.
   ========================================================================== */

import type { Product } from "@/types/catalog";
import { normalizeForSearch } from "@/lib/format";

/** Clave de spec que representa el tamaño/talla. */
const SIZE_SPEC_KEYS = ["Presentación", "Presentacion", "Talla", "Tamaño"];

export interface ProductGroup {
  /** Producto representativo (el primero, normalmente la talla menor). */
  representative: Product;
  /** Todas las variantes del grupo (incluye al representante). */
  variants: Product[];
  /** true si el grupo tiene más de una talla. */
  hasVariants: boolean;
  /** Nombre común del grupo. */
  name: string;
}

/** Devuelve la talla/tamaño: prioriza size_label del backend, luego specs. */
export function getSizeLabel(product: Product): string | null {
  if (product.sizeLabel) return product.sizeLabel;
  if (!product.specs) return null;
  for (const key of SIZE_SPEC_KEYS) {
    const v = product.specs[key];
    if (v) return v;
  }
  return null;
}

/* Palabras del nombre del producto que indican ropa/calzado -> "Tallas". */
const APPAREL_WORDS = [
  "tenis",
  "bota",
  "botas",
  "zapato",
  "calzado",
  "guante",
  "guantes",
  "chaleco",
  "jacket",
  "chaqueta",
  "camisa",
  "pantalon",
  "pantalón",
  "overol",
  "casco",
  "cinturon",
  "cinturón",
  "faja",
  "gafas",
  "mascarilla",
  "respirador",
  "braga",
  "uniforme",
  "indumentaria",
  "ropa",
];

/* Opciones que son solo un color -> "Colores disponibles". */
const COLOR_WORDS = [
  "amarillo",
  "azul",
  "rojo",
  "verde",
  "blanco",
  "negro",
  "gris",
  "naranja",
  "anaranjado",
  "cafe",
  "transparente",
];

/* Productos que se venden por cantidad/empaque -> "Presentaciones". */
const PACK_WORDS = [
  "tornillo",
  "taco",
  "gaza",
  "remache",
  "tuerca",
  "arandela",
  "clavo",
  "abrazadera",
  "brida",
  "electrodo",
  "cinta",
];

/**
 * Devuelve el texto adecuado para el botón/etiqueta de variantes según lo que
 * cambia entre ellas. Analiza el nombre del producto y los valores de talla.
 * - Ropa/calzado -> "Tallas disponibles"
 * - Consumibles por empaque -> "Presentaciones disponibles"
 * - Herramientas con medida numérica (7", 10 mm) -> "Medidas disponibles"
 * - Resto -> "Opciones disponibles"
 */
export function getVariantLabel(group: ProductGroup): string {
  const name = normalizeForSearch(group.name);
  const words = name.split(/\s+/);

  // Si todas las opciones son colores (ej. cascos amarillo/azul/rojo) -> "Colores".
  const optionLabels = group.variants.map((v) => getSizeLabel(v));
  if (
    optionLabels.length > 0 &&
    optionLabels.every(
      (l) => l !== null && COLOR_WORDS.includes(normalizeForSearch(l))
    )
  ) {
    return "Colores disponibles";
  }

  if (words.some((w) => APPAREL_WORDS.includes(w))) {
    return "Tallas disponibles";
  }
  if (words.some((w) => PACK_WORDS.includes(w))) {
    return "Presentaciones disponibles";
  }

  // ¿Las variantes tienen una medida numérica (pulgadas, mm, cm...)?
  const labels = group.variants
    .map((v) => getSizeLabel(v))
    .filter((v): v is string => v !== null);
  const numericLike = labels.filter((l) => /\d/.test(l));
  if (labels.length > 0 && numericLike.length >= labels.length / 2) {
    return "Medidas disponibles";
  }

  return "Opciones disponibles";
}

/** Versión corta para la etiqueta de la tarjeta: "tallas", "medidas"… */
export function getVariantShortLabel(group: ProductGroup): string {
  const full = getVariantLabel(group); // "Tallas disponibles", etc.
  return full.split(" ")[0].toLocaleLowerCase("es");
}

/**
 * Clave de agrupación. Si el backend proveyó variantGroupId (fiable), se usa
 * ese. Si no (datos mock), cae a la heurística nombre + categoría + marca.
 */
function groupKey(p: Product): string {
  if (p.variantGroupId) return `vg:${p.variantGroupId}`;
  return [
    "n:",
    normalizeForSearch(p.name),
    p.categorySlug,
    p.brandId ?? "sin-marca",
  ].join("|");
}

/**
 * Agrupa una lista de productos en grupos de variantes.
 * Conserva el orden de aparición de los representantes.
 */
export function groupByVariants(products: Product[]): ProductGroup[] {
  const map = new Map<string, Product[]>();
  const order: string[] = [];

  for (const p of products) {
    const key = groupKey(p);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(p);
  }

  return order.map((key) => {
    const variants = map.get(key)!;
    // Si el grupo viene del backend (variantGroupId), confiamos en él. Si es
    // por heurística, exigimos que al menos uno tenga etiqueta de tamaño.
    const fromBackend = variants.some((v) => Boolean(v.variantGroupId));
    const anySize = variants.some((v) => getSizeLabel(v) !== null);
    const hasVariants = variants.length > 1 && (fromBackend || anySize);

    // Orden de variantes: por talla de forma natural (número si se puede).
    const sorted = hasVariants ? sortVariants(variants) : variants;

    return {
      representative: sorted[0],
      variants: sorted,
      hasVariants,
      name: sorted[0].name,
    };
  });
}

/** Ordena variantes por su talla de forma natural (7" antes que 10"). */
function sortVariants(variants: Product[]): Product[] {
  return variants.slice().sort((a, b) => {
    const la = getSizeLabel(a) ?? "";
    const lb = getSizeLabel(b) ?? "";
    const na = parseFloat(la.replace(",", "."));
    const nb = parseFloat(lb.replace(",", "."));
    const aNum = !Number.isNaN(na);
    const bNum = !Number.isNaN(nb);
    if (aNum && bNum && na !== nb) return na - nb;
    return la.localeCompare(lb, "es", { numeric: true });
  });
}
