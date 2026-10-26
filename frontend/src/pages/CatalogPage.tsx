import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDataClient, getActiveSource } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  CatalogControls,
  EMPTY_FILTERS,
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

/** Cuántos productos mostrar por categoría en la vista agrupada.
 *  En móvil mostramos menos para que la página no quede tan larga. */
const PREVIEW_PER_CATEGORY_DESKTOP = 8;
const PREVIEW_PER_CATEGORY_MOBILE = 4;

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const showSampleNotice = getActiveSource() === "mock";

  // En pantallas angostas mostramos solo 4 productos por categoría.
  const isMobile = useMediaQuery("(max-width: 640px)");
  const previewPerCategory = isMobile
    ? PREVIEW_PER_CATEGORY_MOBILE
    : PREVIEW_PER_CATEGORY_DESKTOP;

  // Drawer de filtros en móvil (en escritorio el panel va fijo a la izquierda).
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Los filtros viven en la URL (compartible y con botón "atrás").
  const filters: CatalogFilters = {
    search: searchParams.get("q") ?? "",
    categorySlugs: (searchParams.get("categorias") ?? "")
      .split(",")
      .filter(Boolean),
    brandIds: (searchParams.get("marcas") ?? "")
      .split(",")
      .filter(Boolean),
    onlyNew: searchParams.get("nuevos") === "1",
  };

  const setFilters = (next: CatalogFilters) => {
    const params: Record<string, string> = {};
    if (next.search.trim()) params.q = next.search.trim();
    if (next.categorySlugs.length) params.categorias = next.categorySlugs.join(",");
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
    const [productsPage, allCategories, brands] = await Promise.all([
      // pageSize grande: el adapter pagina internamente y trae TODO el catálogo
      // (son 1.600+ productos; Supabase corta en 1.000 por consulta).
      client.getProducts({ pageSize: 5000 }),
      client.getCategories(),
      client.getBrands(),
    ]);
    // Ocultamos las categorías sin productos disponibles (product_count === 0).
    const categories = allCategories.filter((c) => c.productCount !== 0);
    // Mostramos todas las marcas del catálogo fijo aunque aún no tengan productos.
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

  // ¿Hay categorías seleccionadas? (una o varias -> vista de lista filtrada)
  const hasCategoryFilter = filters.categorySlugs.length > 0;

  // Lista final cuando hay categoría(s) seleccionada(s).
  const inSelectedCategory = useMemo(
    () =>
      hasCategoryFilter
        ? baseFiltered.filter((p) =>
            filters.categorySlugs.includes(p.categorySlug)
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseFiltered, filters.categorySlugs.join(",")]
  );

  // Vista agrupada por subcategoría (cuando no hay categoría seleccionada).
  const grouped = useMemo(() => {
    if (!data || hasCategoryFilter) return [];
    const byCat = new Map<string, Product[]>();
    for (const p of baseFiltered) {
      if (!byCat.has(p.categorySlug)) byCat.set(p.categorySlug, []);
      byCat.get(p.categorySlug)!.push(p);
    }
    // Respeta el orden de las categorías (position) devuelto por el backend.
    return data.categories
      .map((cat) => ({ cat, items: byCat.get(cat.slug) ?? [] }))
      .filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, baseFiltered, hasCategoryFilter]);

  // Contamos grupos de variantes (cada "N tallas" cuenta como 1 resultado).
  const totalResults = hasCategoryFilter
    ? groupByVariants(inSelectedCategory).length
    : groupByVariants(baseFiltered).length;

  // Cantidad de filtros activos (para el badge del botón "Filtros").
  const activeFilterCount =
    filters.categorySlugs.length +
    filters.brandIds.length +
    (filters.onlyNew ? 1 : 0) +
    (filters.search.trim() ? 1 : 0);

  // Chips de filtros activos, removibles uno a uno.
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (data) {
    for (const slug of filters.categorySlugs) {
      const name = data.categories.find((c) => c.slug === slug)?.name ?? slug;
      activeChips.push({
        key: `cat-${slug}`,
        label: name,
        onRemove: () =>
          setFilters({
            ...filters,
            categorySlugs: filters.categorySlugs.filter((s) => s !== slug),
          }),
      });
    }
    for (const id of filters.brandIds) {
      const name = data.brands.find((b) => b.id === id)?.name ?? id;
      activeChips.push({
        key: `brand-${id}`,
        label: name,
        onRemove: () =>
          setFilters({
            ...filters,
            brandIds: filters.brandIds.filter((b) => b !== id),
          }),
      });
    }
    if (filters.onlyNew) {
      activeChips.push({
        key: "new",
        label: "Solo nuevos",
        onRemove: () => setFilters({ ...filters, onlyNew: false }),
      });
    }
  }

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

      <div className="catalog-layout">
        {/* Panel de filtros: sidebar fijo en escritorio, drawer en móvil. */}
        {status === "success" && data && (
          <>
            <aside
              className={`catalog-sidebar ${filtersOpen ? "is-open" : ""}`}
              aria-label="Filtros del catálogo"
            >
              <div className="catalog-drawer-head">
                <span>Filtros</span>
                <button
                  type="button"
                  className="catalog-drawer-close"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Cerrar filtros"
                >
                  ✕
                </button>
              </div>
              <CatalogControls
                categories={data.categories}
                brands={data.brands}
                filters={filters}
                onChange={setFilters}
              />
              <div className="catalog-drawer-foot">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => setFiltersOpen(false)}
                >
                  Ver {totalResults} resultado(s)
                </button>
              </div>
            </aside>
            {filtersOpen && (
              <button
                type="button"
                className="catalog-overlay"
                aria-label="Cerrar filtros"
                onClick={() => setFiltersOpen(false)}
              />
            )}
          </>
        )}

        {/* Columna de resultados */}
        <div className="catalog-results">
          {status === "success" && data && (
            <div className="catalog-toolbar">
              <button
                type="button"
                className="btn btn-outline btn-sm catalog-filters-btn"
                onClick={() => setFiltersOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    d="M3 5h18M6 12h12M10 19h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                Filtros
                {activeFilterCount > 0 && (
                  <span className="catalog-filters-badge">{activeFilterCount}</span>
                )}
              </button>
              <span className="result-count muted" aria-live="polite">
                {totalResults} resultado(s)
              </span>
            </div>
          )}

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="active-chip"
                  onClick={chip.onRemove}
                >
                  {chip.label}
                  <span aria-hidden="true" className="active-chip-x">
                    ✕
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {status === "loading" && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <CardsSkeleton count={8} />
            </div>
          )}
          {status === "error" && <ErrorState error={error} onRetry={reload} />}

          {status === "success" && data && totalResults === 0 && (
            <EmptyState title="No encontramos productos">
              Prueba con otra referencia o quita algún filtro.
            </EmptyState>
          )}

          {/* Vista 1: categoría(s) seleccionada(s) -> lista plana */}
          {status === "success" &&
            data &&
            hasCategoryFilter &&
            inSelectedCategory.length > 0 && (
              <div className="grid grid-cards catalog-grid">
                {groupByVariants(inSelectedCategory).map((g) => (
                  <ProductGroupCard key={g.representative.id} group={g} />
                ))}
              </div>
            )}

          {/* Vista 2: sin categoría -> agrupado por subcategoría con preview */}
          {status === "success" &&
            data &&
            !hasCategoryFilter &&
            grouped.length > 0 && (
              <div className="catalog-grouped">
                {grouped.map(({ cat, items }) => {
                  const groups = groupByVariants(items);
                  const preview = groups.slice(0, previewPerCategory);
                  const hasMore = groups.length > previewPerCategory;
                  return (
                    <section key={cat.id} className="catalog-cat-block">
                      <div className="catalog-cat-head">
                        <h2>{cat.name}</h2>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setFilters({ ...filters, categorySlugs: [cat.slug] })
                          }
                        >
                          Ver todos ({groups.length})
                        </button>
                      </div>
                      <div className="grid grid-cards catalog-grid">
                        {preview.map((g) => (
                          <ProductGroupCard key={g.representative.id} group={g} />
                        ))}
                      </div>
                      {hasMore && (
                        <div className="catalog-cat-more">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              setFilters({ ...filters, categorySlugs: [cat.slug] })
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

          {/* Volver a todas cuando hay categoría(s) seleccionada(s) */}
          {status === "success" && data && hasCategoryFilter && (
            <div style={{ marginTop: "var(--space-6)" }}>
              <Link
                to="/catalogo"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setFilters({ ...filters, categorySlugs: [] });
                }}
              >
                ← Ver todas las categorías
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
