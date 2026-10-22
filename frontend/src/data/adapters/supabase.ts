/* ==========================================================================
   Adapter SUPABASE (Opción A) — STUB pendiente de conectar por Claude.
   -------------------------------------------------------------------------
   Claude debe:
     1. Crear el proyecto Supabase, tablas (categories, brands, products,
        product_images) y políticas RLS de solo-lectura pública.
        Ver el esquema sugerido en comunicacion/adjuntos/API_CONTRACT.md.
     2. Instalar @supabase/supabase-js e implementar estas funciones mapeando
        las filas de Supabase a los tipos de @/types/catalog.
   Mientras no esté configurado, lanza un error claro en vez de inventar datos.
   ========================================================================== */

import type { DataClient } from "@/data/dataClient";

const NOT_CONFIGURED =
  "[dataClient:supabase] Supabase aún no está conectado. " +
  "Pendiente: Claude debe configurar VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY " +
  "e implementar el adapter. Usa VITE_DATA_SOURCE=mock mientras tanto.";

export function createSupabaseClient(): DataClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // No inventamos conexión: fallará de forma explícita y la UI mostrará error.
    const fail = async (): Promise<never> => {
      throw new Error(NOT_CONFIGURED);
    };
    return {
      getCategories: fail,
      getCategoryBySlug: fail,
      getBrands: fail,
      getProducts: fail,
      getProductById: fail,
      getProductByReference: fail,
    };
  }

  // TODO (Claude): implementar con @supabase/supabase-js.
  // import { createClient } from "@supabase/supabase-js";
  // const supabase = createClient(url, anonKey);
  // return { getCategories: async () => { ... }, ... }
  const todo = async (): Promise<never> => {
    throw new Error(
      "[dataClient:supabase] Credenciales presentes pero el adapter no está " +
        "implementado todavía. Pendiente de Claude."
    );
  };
  return {
    getCategories: todo,
    getCategoryBySlug: todo,
    getBrands: todo,
    getProducts: todo,
    getProductById: todo,
    getProductByReference: todo,
  };
}
