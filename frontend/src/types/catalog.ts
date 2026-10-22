/* ==========================================================================
   JC Security — Tipos de dominio del catálogo
   Estos tipos son el "contrato de datos" que el frontend espera. Claude debe
   devolver objetos con esta forma, ya sea desde Supabase (Opción A) o desde
   su propia API (Opción B). Ver comunicacion/adjuntos/API_CONTRACT.md.
   ========================================================================== */

/** Imagen de producto preparada para web (ver reglas de imágenes del brief). */
export interface ProductImage {
  /** URL de la imagen optimizada para web. */
  url: string;
  /** Texto alternativo descriptivo basado en información confirmada. */
  alt: string;
  /** Ancho/alto reales si se conocen (ayuda a evitar saltos de layout). */
  width?: number;
  height?: number;
  /**
   * true si la imagen aún no está validada (baja calidad, cortada o sin
   * asociación segura a un producto). El frontend la marca para revisión.
   */
  needsReview?: boolean;
}

/** Marca de un producto (ej. Tolsen, Ferre). */
export interface Brand {
  id: string;
  name: string;
  /** Logo de la marca, opcional. */
  logoUrl?: string;
}

/** Categoría del catálogo (ej. cámaras, redes, herramientas, servicios). */
export interface Category {
  id: string;
  /** Identificador legible para URLs: "herramientas", "camaras"... */
  slug: string;
  name: string;
  description?: string;
  /** Icono o imagen representativa, opcional. */
  imageUrl?: string;
  /** Cantidad de productos, si el backend la provee. */
  productCount?: number;
}

/** Producto o servicio del catálogo. */
export interface Product {
  id: string;
  /** Referencia/código original del catálogo. Clave para búsqueda. */
  reference: string;
  name: string;
  /** slug de la categoría a la que pertenece. */
  categorySlug: string;
  /** id de la marca, si aplica (los servicios pueden no tener marca). */
  brandId?: string;
  brandName?: string;
  description?: string;
  images: ProductImage[];
  /**
   * Características técnicas confirmadas (clave: valor). Nunca inventadas.
   * Ej: { "Material": "Acero CrV", "Longitud": "200 mm" }
   */
  specs?: Record<string, string>;
  /**
   * true si es un servicio (no un producto físico). Los servicios también se
   * consultan por WhatsApp.
   */
  isService?: boolean;
  /** true si el catálogo marca el producto como NUEVO (sello del PDF). */
  isNew?: boolean;
  /**
   * true cuando el registro proviene de datos de muestra (MOCK) y NO de una
   * fuente oficial. El frontend lo usa para advertir visualmente.
   */
  isSample?: boolean;
}

/** Parámetros de búsqueda/filtrado del catálogo. */
export interface CatalogQuery {
  /** Texto libre: referencia, nombre o marca. */
  search?: string;
  categorySlug?: string;
  brandIds?: string[];
  /** Filtros por característica, ej. { "Material": ["Acero CrV"] } */
  specFilters?: Record<string, string[]>;
  /** Paginación opcional. */
  page?: number;
  pageSize?: number;
}

/** Respuesta paginada genérica. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
