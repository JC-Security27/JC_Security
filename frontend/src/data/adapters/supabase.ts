/* ==========================================================================
   Adapter SUPABASE (Opción A) — lee el catálogo directo de Supabase.
   -------------------------------------------------------------------------
   Backend creado por Claude (ver comunicacion/para-kiro.md):
     - Tablas: brands, categories, products, product_images
     - Vista: categories_with_count (añade product_count)
     - RLS de solo lectura pública; los EoL (discontinued) se ocultan solos.
     - Imágenes en el bucket público "catalogo".
   Credenciales via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (no en el repo).
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DataClient } from "@/data/dataClient";
import type {
  Brand,
  CatalogQuery,
  Category,
  Paginated,
  Product,
  ProductImage,
} from "@/types/catalog";

const BUCKET = "catalogo";

/* ----- Tipos de las filas tal como llegan de Supabase (snake_case) ----- */
interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
}
interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_slug: string | null;
  position: number;
  product_count?: number;
}
interface ProductImageRow {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  needs_review: boolean;
  position: number;
}
interface ProductRow {
  id: string;
  reference: string;
  name: string;
  category_slug: string;
  brand_id: string | null;
  description: string | null;
  specs: Record<string, string> | null;
  is_service: boolean;
  is_new: boolean;
  brands: { name: string } | null;
  product_images: ProductImageRow[] | null;
}

/* ----- Mapeo fila → tipo de dominio (snake_case → camelCase) ----- */

function resolveImageUrl(baseUrl: string, raw: string): string {
  // Si ya es una URL absoluta, se usa tal cual. Si es relativa (ej.
  // "images/tolsen-10001.webp" o "tolsen-10001.webp"), se construye la URL
  // pública del bucket.
  if (/^https?:\/\//i.test(raw)) return raw;
  const file = raw.replace(/^images\//, "").replace(/^\/+/, "");
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${file}`;
}

function mapImage(baseUrl: string, row: ProductImageRow): ProductImage {
  return {
    url: resolveImageUrl(baseUrl, row.url),
    alt: row.alt,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    needsReview: row.needs_review,
  };
}

function mapProduct(baseUrl: string, row: ProductRow): Product {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => mapImage(baseUrl, img));
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    categorySlug: row.category_slug,
    brandId: row.brand_id ?? undefined,
    brandName: row.brands?.name,
    description: row.description ?? undefined,
    images,
    specs: row.specs ?? undefined,
    isService: row.is_service,
    isNew: row.is_new,
    isSample: false,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    productCount: row.product_count,
  };
}

const PRODUCT_SELECT = "*, brands(name), product_images(*)";

export function createSupabaseClient(): DataClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const fail = async (): Promise<never> => {
      throw new Error(
        "[dataClient:supabase] Faltan VITE_SUPABASE_URL o " +
          "VITE_SUPABASE_ANON_KEY. Ponlas en frontend/.env.local (y en Vercel)."
      );
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

  const baseUrl = url.replace(/\/$/, "");
  const sb: SupabaseClient = createClient(baseUrl, anonKey, {
    auth: { persistSession: false },
  });

  function applyFilters<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    q: CatalogQuery
  ): T {
    if (q.categorySlug) query = query.eq("category_slug", q.categorySlug);
    if (q.brandIds && q.brandIds.length > 0) {
      query = query.in("brand_id", q.brandIds);
    }
    if (q.search && q.search.trim()) {
      const term = q.search.trim();
      // Busca por referencia o nombre (insensible a may/min).
      query = query.or(`reference.ilike.%${term}%,name.ilike.%${term}%`);
    }
    return query as T;
  }

  return {
    async getCategories() {
      const { data, error } = await sb
        .from("categories_with_count")
        .select("*")
        .order("position");
      if (error) throw new Error(`[supabase] categorías: ${error.message}`);
      return (data as CategoryRow[]).map(mapCategory);
    },

    async getCategoryBySlug(slug) {
      const { data, error } = await sb
        .from("categories_with_count")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(`[supabase] categoría: ${error.message}`);
      return data ? mapCategory(data as CategoryRow) : null;
    },

    async getBrands() {
      const { data, error } = await sb.from("brands").select("*").order("name");
      if (error) throw new Error(`[supabase] marcas: ${error.message}`);
      return (data as BrandRow[]).map((b) => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logo_url ?? undefined,
      })) as Brand[];
    },

    async getProducts(query: CatalogQuery = {}) {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 200;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let base = sb
        .from("products")
        .select(PRODUCT_SELECT, { count: "exact" })
        .order("position", { referencedTable: "product_images" });
      base = applyFilters(base, query);
      base = base.order("reference").range(from, to);

      const { data, error, count } = await base;
      if (error) throw new Error(`[supabase] productos: ${error.message}`);
      const items = (data as ProductRow[]).map((r) => mapProduct(baseUrl, r));
      const result: Paginated<Product> = {
        items,
        total: count ?? items.length,
        page,
        pageSize,
      };
      return result;
    },

    async getProductById(id) {
      const { data, error } = await sb
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`[supabase] producto: ${error.message}`);
      return data ? mapProduct(baseUrl, data as ProductRow) : null;
    },

    async getProductByReference(reference) {
      const { data, error } = await sb
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("reference", reference)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`[supabase] referencia: ${error.message}`);
      return data ? mapProduct(baseUrl, data as ProductRow) : null;
    },
  };
}
