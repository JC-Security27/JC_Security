/* ==========================================================================
   JC Security — DATOS DE MUESTRA (MOCK)
   -------------------------------------------------------------------------
   ⚠️  ESTE CONTENIDO ES DE MUESTRA, NO OFICIAL. Sirve solo para construir y
   previsualizar la interfaz mientras JC Security comparte sus catálogos PDF.
   Todos los productos llevan isSample: true y NO deben presentarse como reales.
   No hay precios. Las imágenes son placeholders generados (SVG), no fotos de
   producto reales.
   ========================================================================== */

import type { Brand, Category, Product } from "@/types/catalog";

export const mockCategories: Category[] = [
  {
    id: "cat-camaras",
    slug: "camaras",
    name: "Cámaras",
    description:
      "Videovigilancia para hogar y negocio. (Categoría de muestra.)",
  },
  {
    id: "cat-redes",
    slug: "redes",
    name: "Redes",
    description: "Equipos de conectividad y red. (Categoría de muestra.)",
  },
  {
    id: "cat-herramientas",
    slug: "herramientas",
    name: "Herramientas",
    description:
      "Herramientas para instalación y mantenimiento. (Categoría de muestra.)",
  },
  {
    id: "cat-servicios",
    slug: "servicios",
    name: "Servicios de seguridad",
    description:
      "Instalación, asesoría y soporte. (Categoría de muestra.)",
  },
];

export const mockBrands: Brand[] = [
  { id: "brand-tolsen", name: "Tolsen" },
  { id: "brand-ferre", name: "Ferre" },
  { id: "brand-generica", name: "Marca de muestra" },
];

/** Genera un placeholder SVG en data-URL (no es foto real de producto). */
function placeholderImage(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#10243b"/>
    <rect x="0" y="0" width="400" height="300" fill="none" stroke="#2d5b9a" stroke-width="2" stroke-dasharray="8 6"/>
    <text x="200" y="150" font-family="sans-serif" font-size="18" fill="#42d7e7" text-anchor="middle" dominant-baseline="middle">${label}</text>
    <text x="200" y="178" font-family="sans-serif" font-size="12" fill="#9fb3c7" text-anchor="middle" dominant-baseline="middle">imagen de muestra</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function sampleProduct(
  p: Omit<Product, "images" | "isSample"> & { imageLabel?: string }
): Product {
  const { imageLabel, ...rest } = p;
  return {
    ...rest,
    isSample: true,
    images: [
      {
        url: placeholderImage(imageLabel ?? rest.reference),
        alt: `${rest.name} (imagen de muestra)`,
        width: 400,
        height: 300,
      },
    ],
  };
}

export const mockProducts: Product[] = [
  sampleProduct({
    id: "p-1",
    reference: "TOL-14001",
    name: "Juego de destornilladores (muestra)",
    categorySlug: "herramientas",
    brandId: "brand-tolsen",
    brandName: "Tolsen",
    description: "Set de muestra para previsualizar la ficha de producto.",
    specs: { Piezas: "6", Material: "Acero CrV" },
  }),
  sampleProduct({
    id: "p-2",
    reference: "TOL-20012",
    name: "Alicate universal (muestra)",
    categorySlug: "herramientas",
    brandId: "brand-tolsen",
    brandName: "Tolsen",
    description: "Producto de muestra.",
    specs: { Longitud: "200 mm" },
  }),
  sampleProduct({
    id: "p-3",
    reference: "FER-30055",
    name: "Taladro percutor (muestra)",
    categorySlug: "herramientas",
    brandId: "brand-ferre",
    brandName: "Ferre",
    description: "Producto de muestra.",
    specs: { Potencia: "650 W" },
  }),
  sampleProduct({
    id: "p-4",
    reference: "CAM-1080",
    name: "Cámara de seguridad 1080p (muestra)",
    categorySlug: "camaras",
    brandId: "brand-generica",
    brandName: "Marca de muestra",
    description: "Producto de muestra para la categoría de cámaras.",
    specs: { Resolución: "1080p", Interior: "Sí" },
  }),
  sampleProduct({
    id: "p-5",
    reference: "CAM-4K",
    name: "Cámara exterior 4K (muestra)",
    categorySlug: "camaras",
    brandId: "brand-generica",
    brandName: "Marca de muestra",
    description: "Producto de muestra.",
    specs: { Resolución: "4K", Exterior: "Sí" },
  }),
  sampleProduct({
    id: "p-6",
    reference: "NET-SW8",
    name: "Switch de red 8 puertos (muestra)",
    categorySlug: "redes",
    brandId: "brand-generica",
    brandName: "Marca de muestra",
    description: "Producto de muestra para la categoría de redes.",
    specs: { Puertos: "8", Velocidad: "Gigabit" },
  }),
  sampleProduct({
    id: "s-1",
    reference: "SRV-INST",
    name: "Instalación de sistema de videovigilancia (muestra)",
    categorySlug: "servicios",
    description: "Servicio de muestra. La consulta se hace por WhatsApp.",
    isService: true,
  }),
];
