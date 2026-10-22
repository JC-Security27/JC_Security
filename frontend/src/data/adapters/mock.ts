/* ==========================================================================
   Adapter MOCK — datos de muestra en memoria.
   Simula una pequeña latencia para que los estados de carga sean visibles.
   ========================================================================== */

import type { DataClient } from "@/data/dataClient";
import { mockBrands, mockCategories, mockProducts } from "@/data/mock";
import type {
  CatalogQuery,
  Paginated,
  Product,
} from "@/types/catalog";

const LATENCY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function matchesSearch(p: Product, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    p.reference.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    (p.brandName?.toLowerCase().includes(q) ?? false)
  );
}

function matchesFilters(p: Product, query: CatalogQuery): boolean {
  if (query.categorySlug && p.categorySlug !== query.categorySlug) return false;
  if (query.brandIds && query.brandIds.length > 0) {
    if (!p.brandId || !query.brandIds.includes(p.brandId)) return false;
  }
  if (query.specFilters) {
    for (const [key, allowed] of Object.entries(query.specFilters)) {
      if (allowed.length === 0) continue;
      const value = p.specs?.[key];
      if (!value || !allowed.includes(value)) return false;
    }
  }
  return true;
}

export function createMockClient(): DataClient {
  return {
    async getCategories() {
      return delay(mockCategories.slice());
    },

    async getCategoryBySlug(slug) {
      return delay(mockCategories.find((c) => c.slug === slug) ?? null);
    },

    async getBrands() {
      return delay(mockBrands.slice());
    },

    async getProducts(query: CatalogQuery = {}) {
      const filtered = mockProducts.filter(
        (p) => matchesSearch(p, query.search ?? "") && matchesFilters(p, query)
      );
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? (filtered.length || 1);
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      const result: Paginated<Product> = {
        items,
        total: filtered.length,
        page,
        pageSize,
      };
      return delay(result);
    },

    async getProductById(id) {
      return delay(mockProducts.find((p) => p.id === id) ?? null);
    },

    async getProductByReference(reference) {
      const ref = reference.trim().toLowerCase();
      return delay(
        mockProducts.find((p) => p.reference.toLowerCase() === ref) ?? null
      );
    },
  };
}
