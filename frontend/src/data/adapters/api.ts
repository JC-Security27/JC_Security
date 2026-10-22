/* ==========================================================================
   Adapter API (Opción B) — consume la API del backend de Claude.
   -------------------------------------------------------------------------
   Implementa las llamadas HTTP contra los endpoints definidos en
   comunicacion/adjuntos/API_CONTRACT.md. La URL base viene de
   VITE_API_BASE_URL. Si no está configurada, falla de forma explícita en vez
   de inventar un endpoint.
   ========================================================================== */

import type { DataClient } from "@/data/dataClient";
import type {
  Brand,
  CatalogQuery,
  Category,
  Paginated,
  Product,
} from "@/types/catalog";

function getBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) {
    throw new Error(
      "[dataClient:api] VITE_API_BASE_URL no está configurada. " +
        "Pendiente: Claude debe desplegar la API y proveer la URL. " +
        "Usa VITE_DATA_SOURCE=mock mientras tanto."
    );
  }
  return base.replace(/\/$/, "");
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`[dataClient:api] ${res.status} en ${path}`);
  }
  return (await res.json()) as T;
}

function toQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.categorySlug) params.set("category", query.categorySlug);
  if (query.brandIds?.length) params.set("brands", query.brandIds.join(","));
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.specFilters) {
    for (const [key, vals] of Object.entries(query.specFilters)) {
      if (vals.length) params.set(`spec.${key}`, vals.join(","));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function createApiClient(): DataClient {
  return {
    getCategories() {
      return getJson<Category[]>("/categories");
    },
    getCategoryBySlug(slug) {
      return getJson<Category | null>(`/categories/${encodeURIComponent(slug)}`);
    },
    getBrands() {
      return getJson<Brand[]>("/brands");
    },
    getProducts(query: CatalogQuery = {}) {
      return getJson<Paginated<Product>>(`/products${toQueryString(query)}`);
    },
    getProductById(id) {
      return getJson<Product | null>(`/products/${encodeURIComponent(id)}`);
    },
    getProductByReference(reference) {
      return getJson<Product | null>(
        `/products/by-reference/${encodeURIComponent(reference)}`
      );
    },
  };
}
