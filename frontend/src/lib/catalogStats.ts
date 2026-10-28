import { useEffect, useState } from "react";
import { getDataClient } from "@/data/dataClient";
import { groupByVariants } from "@/lib/variants";
import type { Product } from "@/types/catalog";

/* El catálogo completo se pide una sola vez por visita y se comparte (buscador
   del encabezado, cifras de la portada…). */
let catalogPromise: Promise<Product[]> | null = null;
export function loadCatalog(): Promise<Product[]> {
  if (!catalogPromise) {
    catalogPromise = getDataClient()
      .then((c) => c.getProducts({ pageSize: 5000 }))
      .then((page) => page.items)
      .catch((e) => {
        catalogPromise = null; // reintenta la próxima vez
        throw e;
      });
  }
  return catalogPromise;
}

export interface CatalogStats {
  /** Productos como los cuenta el catálogo (las medidas de un artículo cuentan una vez). */
  products: number;
  brands: number;
}

/** Redondea hacia abajo a la centena (1.563 -> 1.500) o decena para números chicos. */
function floorNice(n: number): number {
  const step = n >= 1000 ? 100 : 10;
  return Math.floor(n / step) * step;
}

/** "+1.500" con separador de miles costarricense. */
export function formatPlus(n: number): string {
  return `+${floorNice(n).toLocaleString("es-CR").replace(/\s|,/g, ".")}`;
}

/**
 * Cifras reales del catálogo para la portada. Mientras carga devuelve null
 * (el componente muestra un valor seguro).
 */
export function useCatalogStats(): CatalogStats | null {
  const [stats, setStats] = useState<CatalogStats | null>(null);
  useEffect(() => {
    let alive = true;
    loadCatalog()
      .then((items) => {
        if (!alive) return;
        const brands = new Set(items.map((p) => p.brandId).filter(Boolean));
        setStats({ products: groupByVariants(items).length, brands: brands.size });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}
