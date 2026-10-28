import type { Category } from "@/types/catalog";

/* ==========================================================================
   Familias de categorías (pedido del usuario, 2026-10-28): en el panel de
   filtros las categorías se agrupan en pestañas desplegables ("Herramientas",
   "Cámaras y videovigilancia"…) para que no se vean tantas opciones de una.
   Los mismos grupos alimentan los enlaces del pie de página.
   Una categoría nueva que no esté en ningún grupo cae en "Otros", así nunca
   desaparece del filtro.
   ========================================================================== */

export interface CategoryGroupDef {
  id: string;
  name: string;
  slugs: string[];
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    id: "camaras",
    name: "Cámaras y videovigilancia",
    slugs: [
      "camaras-ip",
      "camaras-hdcvi",
      "grabadores",
      "kits-cctv",
      "almacenamiento",
      "accesorios-seguridad",
      "solucion-movil",
      "monitores",
    ],
  },
  {
    id: "alarmas",
    name: "Alarmas e incendio",
    slugs: ["alarmas", "deteccion-de-incendio"],
  },
  {
    id: "acceso",
    name: "Control de acceso",
    slugs: ["control-de-acceso", "videoporteros"],
  },
  {
    id: "redes",
    name: "Redes y cableado",
    slugs: ["redes", "gabinetes-y-cableado", "canaletas-e-instalacion"],
  },
  {
    id: "energia",
    name: "Energía",
    slugs: ["fuentes-de-poder", "ups-y-reguladores", "baterias-y-pilas"],
  },
  {
    id: "herramientas",
    name: "Herramientas",
    slugs: [
      "herramientas-de-corte",
      "herramientas-de-impacto",
      "cubos-y-llaves",
      "herramientas-de-medicion",
      "desatornilladores-y-brocas",
      "herramientas-dielectricas",
      "herramientas-inalambricas",
      "herramientas-alambricas",
      "bolsas-de-herramientas-y-almacenamiento",
      "otros",
    ],
  },
  {
    id: "proteccion",
    name: "Ropa y protección",
    slugs: ["indumentaria"],
  },
  {
    id: "hogar",
    name: "Hogar inteligente y otros",
    slugs: ["hogar-inteligente", "otros-seguridad"],
  },
];

export interface CategoryGroup {
  id: string;
  name: string;
  categories: Category[];
  productCount: number;
}

/** Agrupa las categorías disponibles; omite grupos vacíos. */
export function groupCategories(categories: Category[]): CategoryGroup[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const used = new Set<string>();
  const groups: CategoryGroup[] = CATEGORY_GROUPS.map((g) => {
    const cats = g.slugs
      .map((s) => bySlug.get(s))
      .filter((c): c is Category => Boolean(c));
    cats.forEach((c) => used.add(c.slug));
    return { id: g.id, name: g.name, categories: cats, productCount: 0 };
  });
  const rest = categories.filter((c) => !used.has(c.slug));
  if (rest.length) {
    groups.push({ id: "otros-grupo", name: "Otros", categories: rest, productCount: 0 });
  }
  for (const g of groups) {
    g.productCount = g.categories.reduce((n, c) => n + (c.productCount ?? 0), 0);
  }
  return groups.filter((g) => g.categories.length > 0);
}

/** Enlace al catálogo filtrado por un grupo (para el pie de página, etc.). */
export function groupCatalogUrl(groupId: string): string {
  const g = CATEGORY_GROUPS.find((x) => x.id === groupId);
  return g ? `/catalogo?categorias=${g.slugs.join(",")}` : "/catalogo";
}
