import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDataClient, getActiveSource } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import {
  CatalogControls,
  type CatalogFilters,
} from "@/components/catalog/CatalogControls";
import { ProductGroupCard } from "@/components/catalog/ProductGroupCard";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  SampleNotice,
} from "@/components/ui/states";
import { normalizeForSearch } from "@/lib/format";
import { groupByVariants } from "@/lib/variants";
import { withDemoBrands } from "@/config/brandLogos";
import type { Brand, Category, Product } from "@/types/catalog";

/** Cuántos productos mostrar por categoría en la vista agrupada. */
const PREVIEW_PER_CATEGORY = 8;

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const showSampleNotice = getActiveSource() === "mock";

  // Los filtros viven en la URL (compartible y con botón "atrás").
  const filters: CatalogFilters = {
    search: searchParams.get("q") ?? "",
    categorySlug: searchParams.get("categoria") ?? "",
    brandIds: (searchParams.get("marcas") ?? "")
      .split(",")
      .filter(Boolean),
    onlyNew: searchParams.get("nuevos") === "1",
  };

  const setFilters = (next: CatalogFilters) => {
    const params: Record<string, string> = {};
    if (next.search.trim()) params.q = next.search.trim();
    if (next.categorySlug) params.categoria = next.categorySlug;
    if (next.brandIds.length) params.marcas = next.brandIds.join(",");
    if (next.onlyNew) params.nuevos = "1";
    setSearchParams(params, { replace: true });
  };

  const { status, data, error, reload } = useAsync<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
  }>(async () => {
    const client = await getDataClient();
    const [productsPage, categories, brands] = await Promise.all([
      client.getProducts({ pageSize: 1000 }),
      client.getCategories(),
      client.getBrands(),
    ]);
    // Incluye marcas de ejemplo (Dahua) aunque aún no tengan productos.
    return { products: productsPage.items, categories, brands: withDemoBrands(brands) };
  }, []);

  // Aplica búsqueda + marca + nuevos (la categoría se maneja aparte para poder
  // agrupar cuando no hay una seleccionada).
  const matchesCommon = (p: Product): boolean => {
    const q = normalizeForSearch(filters.search.trim());
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
  };

  const baseFiltered = useMemo(() => {
    if (!data) return [];
    return data.products.filter(matchesCommon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters.search, filters.brandIds.join(","), filters.onlyNew]);

  // Lista final cuando hay una categoría seleccionada.
  const inSelectedCategory = useMemo(
    () =>
      filters.categorySlug
        ? baseFiltered.filter((p) => p.categorySlug === filters.categorySlug)
        : [],
    [baseFiltered, filters.categorySlug]
  );

  // Vista agrupada por subcategoría (cuando categoría = "Todas").
  const grouped = useMemo(() => {
    if (!data || filters.categorySlug) return [];
    const byCat = new Map<string, Product[]>();
    for (const p of baseFiltered) {
      if (!byCat.has(p.categorySlug)) byCat.set(p.categorySlug, []);
      byCat.get(p.categorySlug)!.push(p);
    }
    // Respeta el orden de las categorías (position) devuelto por el backend.
    return data.categories
      .map((cat) => ({ cat, items: byCat.get(cat.slug) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [data, baseFiltered, filters.categorySlug]);

  // Contamos grupos de variantes (cada "N tallas" cuenta como 1 resultado).
  const totalResults = filters.categorySlug
    ? groupByVariants(inSelectedCategory).length
    : groupByVariants(baseFiltered).length;

  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Catálogo</span>
        <h1>Productos y servicios</h1>
        <p>
          Explora por categoría, filtra por marca o busca por referencia. Para
          precio y disponibilidad, consulta por WhatsApp.
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
          categories={data.categories}
          brands={data.brands}
          filters={filters}
          onChange={setFilters}
          resultCount={totalResults}
        />
      )}

      {status === "loading" && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <CardsSkeleton count={8} />
        </div>
      )}
      {status === "error" && <ErrorState error={error} onRetry={reload} />}

      {status === "success" && data && totalResults === 0 && (
        <EmptyState title="No encontramos productos">
          Prueba con otra referencia o quita algún filtro.
        </EmptyState>
      )}

      {/* Vista 1: categoría seleccionada -> lista plana (agrupando tallas) */}
      {status === "success" &&
        data &&
        filters.categorySlug &&
        inSelectedCategory.length > 0 && (
          <div className="grid grid-cards catalog-grid">
            {groupByVariants(inSelectedCategory).map((g) => (
              <ProductGroupCard key={g.representative.id} group={g} />
            ))}
          </div>
        )}

      {/* Vista 2: "Todas" -> agrupado por subcategoría con preview */}
      {status === "success" &&
        data &&
        !filters.categorySlug &&
        grouped.length > 0 && (
          <div className="catalog-grouped">
            {grouped.map(({ cat, items }) => {
              // Agrupamos las tallas: cada grupo cuenta como un producto.
              const groups = groupByVariants(items);
              const preview = groups.slice(0, PREVIEW_PER_CATEGORY);
              const hasMore = groups.length > PREVIEW_PER_CATEGORY;
              return (
                <section key={cat.id} className="catalog-cat-block">
                  <div className="catalog-cat-head">
                    <h2>{cat.name}</h2>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setFilters({ ...filters, categorySlug: cat.slug })
                      }
                    >
                      Ver todos ({groups.length})
                    </button>
                  </div>
                  <div className="grid grid-cards catalog-grid">
                    {preview.map((g) => (
                      <ProductGroupCard
                        key={g.representative.id}
                        group={g}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="catalog-cat-more">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setFilters({ ...filters, categorySlug: cat.slug })
                        }
                      >
                        Ver los {groups.length} de {cat.name}
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

      {/* Volver a todas cuando hay una categoría seleccionada */}
      {status === "success" && data && filters.categorySlug && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <Link
            to="/catalogo"
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.preventDefault();
              setFilters({ ...filters, categorySlug: "" });
            }}
          >
            ← Ver todas las categorías
          </Link>
        </div>
      )}
    </section>
  );
}
