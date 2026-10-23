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

/** Devuelve el valor de talla/tamaño de un producto, si lo tiene. */
export function getSizeLabel(product: Product): string | null {
  if (!product.specs) return null;
  for (const key of SIZE_SPEC_KEYS) {
    const v = product.specs[key];
    if (v) return v;
  }
  return null;
}

/** Clave de agrupación: nombre + categoría + marca. */
function groupKey(p: Product): string {
  return [
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
    // Solo tratamos como "grupo con tallas" si hay más de uno Y al menos uno
    // tiene etiqueta de tamaño (para no agrupar duplicados sin sentido).
    const anySize = variants.some((v) => getSizeLabel(v) !== null);
    const hasVariants = variants.length > 1 && anySize;

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
