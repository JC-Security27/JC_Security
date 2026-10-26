import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDataClient, getActiveSource } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import {
  CatalogControls,
  EMPTY_FILTERS,
  type CatalogFilters,
} from "@/components/catalog/CatalogControls";
import { BrandGroupedProducts } from "@/components/catalog/BrandGroupedProducts";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  SampleNotice,
} from "@/components/ui/states";
import { normalizeForSearch } from "@/lib/format";
import { BackButton } from "@/components/ui/BackButton";
import type { Brand, Category, Product } from "@/types/catalog";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const [filters, setFilters] = useState<CatalogFilters>({
    ...EMPTY_FILTERS,
  });
  const showSampleNotice = getActiveSource() === "mock";

  const { status, data, error, reload } = useAsync<{
    category: Category | null;
    products: Product[];
    brands: Brand[];
  }>(async () => {
    const client = await getDataClient();
    const [category, productsPage, allBrands] = await Promise.all([
      client.getCategoryBySlug(slug),
      client.getProducts({ categorySlug: slug, pageSize: 1000 }),
      client.getBrands(),
    ]);
    const products = productsPage.items;
    // Solo mostramos marcas presentes en esta categoría.
    const presentBrandIds = new Set(
      products.map((p) => p.brandId).filter(Boolean) as string[]
    );
    const brands = allBrands.filter((b) => presentBrandIds.has(b.id));
    return { category, products, brands };
  }, [slug]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = normalizeForSearch(filters.search.trim());
    return data.products.filter((p) => {
      const matchesSearch =
        !q ||
        normalizeForSearch(p.reference).includes(q) ||
        normalizeForSearch(p.name).includes(q) ||
        (p.brandName ? normalizeForSearch(p.brandName).includes(q) : false);
      const matchesBrand =
        filters.brandIds.length === 0 ||
        (p.brandId ? filters.brandIds.includes(p.brandId) : false);
      const matchesNew = !filters.onlyNew || Boolean(p.isNew);
      return matchesSearch && matchesBrand && matchesNew;
    });
  }, [data, filters]);

  return (
    <section className="section container">
      <div className="detail-topbar">
        <BackButton fallback="/catalogo" />
      </div>
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/catalogo">Catálogo</Link>
        <span aria-hidden="true">/</span>
        <span>{data?.category?.name ?? slug}</span>
      </nav>

      <div className="section-head">
        <span className="eyebrow">Categoría</span>
        <h1>{data?.category?.name ?? "Categoría"}</h1>
        {data?.category?.description && <p>{data.category.description}</p>}
      </div>

      {showSampleNotice && (
        <SampleNotice>
          <strong>Contenido de muestra.</strong> Estás viendo datos de ejemplo
          para previsualizar el diseño.
        </SampleNotice>
      )}

      {status === "success" && data && (
        <CatalogControls
          categories={[]}
          brands={data.brands}
          filters={filters}
          onChange={setFilters}
        />
      )}

      {status === "loading" && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <CardsSkeleton count={6} />
        </div>
      )}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "success" &&
        data &&
        (data.category === null ? (
          <EmptyState title="Categoría no encontrada">
            <Link to="/catalogo">Volver al catálogo</Link>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin productos para mostrar">
            Ajusta la búsqueda o limpia los filtros.
          </EmptyState>
        ) : (
          <BrandGroupedProducts products={filtered} />
        ))}
    </section>
  );
}
