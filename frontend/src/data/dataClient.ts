/* ==========================================================================
   JC Security — dataClient (capa de datos del frontend)
   -------------------------------------------------------------------------
   El frontend SOLO habla con esta interfaz. Hoy usa el adapter "mock".
   Claude conectará:
     - Opción A: adapter "supabase" (lee directo de Supabase con anon key + RLS)
     - Opción B: adapter "api" (consume la API del backend de Claude)
   La fuente se elige con VITE_DATA_SOURCE. Ningún componente de UI conoce la
   fuente real: así se puede cambiar sin tocar la interfaz.
   ========================================================================== */

import type {
  Brand,
  CatalogQuery,
  Category,
  Paginated,
  Product,
} from "@/types/catalog";

/** Contrato que cualquier fuente de datos debe cumplir. */
export interface DataClient {
  /** Lista todas las categorías. */
  getCategories(): Promise<Category[]>;
  /** Devuelve una categoría por su slug (o null si no existe). */
  getCategoryBySlug(slug: string): Promise<Category | null>;
  /** Lista todas las marcas. */
  getBrands(): Promise<Brand[]>;
  /** Busca/filtra productos. */
  getProducts(query?: CatalogQuery): Promise<Paginated<Product>>;
  /** Devuelve un producto por id (o null). */
  getProductById(id: string): Promise<Product | null>;
  /** Devuelve un producto por su referencia/código (o null). */
  getProductByReference(reference: string): Promise<Product | null>;
}

export type DataSource = "mock" | "supabase" | "api";

export function getActiveSource(): DataSource {
  const src = import.meta.env.VITE_DATA_SOURCE;
  if (src === "supabase" || src === "api") return src;
  return "mock";
}

/* -------------------------------------------------------------------------
   Selección perezosa del adapter según VITE_DATA_SOURCE.
   ------------------------------------------------------------------------- */
let clientPromise: Promise<DataClient> | null = null;

async function createClient(): Promise<DataClient> {
  const source = getActiveSource();
  switch (source) {
    case "supabase": {
      const { createSupabaseClient } = await import("./adapters/supabase");
      return createSupabaseClient();
    }
    case "api": {
      const { createApiClient } = await import("./adapters/api");
      return createApiClient();
    }
    case "mock":
    default: {
      const { createMockClient } = await import("./adapters/mock");
      return createMockClient();
    }
  }
}

/** Obtiene (y memoiza) el cliente de datos activo. */
export function getDataClient(): Promise<DataClient> {
  if (!clientPromise) clientPromise = createClient();
  return clientPromise;
}
