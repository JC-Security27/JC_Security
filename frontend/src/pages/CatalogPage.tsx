import { useMemo, useState } from "react";
import { getDataClient, getActiveSource } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import {
  CatalogControls,
  type CatalogFilters,
} from "@/components/catalog/CatalogControls";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  SampleNotice,
} from "@/components/ui/states";
import type { Brand, Product } from "@/types/catalog";

export function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>({
    search: "",
    brandIds: [],
  });
  const showSampleNotice = getActiveSource() === "mock";

  const { status, data, error, reload } = useAsync<{
    products: Product[];
    brands: Brand[];
  }>(async () => {
    const client = await getDataClient();
    const [productsPage, brands] = await Promise.all([
      client.getProducts({ pageSize: 1000 }),
      client.getBrands(),
    ]);
    return { products: productsPage.items, brands };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filters.search.trim().toLowerCase();
    return data.products.filter((p) => {
      const matchesSearch =
        !q ||
        p.reference.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false);
      const matchesBrand =
        filters.brandIds.length === 0 ||
        (p.brandId ? filters.brandIds.includes(p.brandId) : false);
      return matchesSearch && matchesBrand;
    });
  }, [data, filters]);

  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Catálogo</span>
        <h1>Productos y servicios</h1>
        <p>
          Busca por referencia, nombre o marca y combina filtros. Para precio y
          disponibilidad, consulta por WhatsApp.
        </p>
      </div>

      {showSampleNotice && (
        <SampleNotice>
          <strong>Contenido de muestra.</strong> Estás viendo datos de ejemplo
          para previsualizar el diseño.
        </SampleNotice>
      )}

      {status === "success" && data && (
        <CatalogControls
          brands={data.brands}
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
        />
      )}

      {status === "loading" && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <CardsSkeleton count={8} />
        </div>
      )}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "success" &&
        data &&
        (filtered.length === 0 ? (
          <EmptyState title="No encontramos productos">
            Prueba con otra referencia o quita algún filtro.
          </EmptyState>
        ) : (
          <div className="grid grid-cards catalog-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ))}
    </section>
  );
}
