import type { Brand, Category } from "@/types/catalog";

/* Controles de búsqueda y filtros del catálogo: texto + categoría + marca +
   solo nuevos, combinables, con botón de limpiar. */
export interface CatalogFilters {
  search: string;
  categorySlug: string; // "" = todas
  brandIds: string[];
  onlyNew: boolean;
}

export const EMPTY_FILTERS: CatalogFilters = {
  search: "",
  categorySlug: "",
  brandIds: [],
  onlyNew: false,
};

export function CatalogControls({
  categories,
  brands,
  filters,
  onChange,
  resultCount,
}: {
  categories: Category[];
  brands: Brand[];
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  resultCount: number | null;
}) {
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.categorySlug !== "" ||
    filters.brandIds.length > 0 ||
    filters.onlyNew;

  const toggleBrand = (id: string) => {
    const set = new Set(filters.brandIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...filters, brandIds: [...set] });
  };

  return (
    <div className="catalog-controls">
      {/* Búsqueda */}
      <div className="search-row">
        <div className="search-field">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            className="search-icon"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="16.5"
              y1="16.5"
              x2="21"
              y2="21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Buscar por referencia, nombre o marca…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            aria-label="Buscar productos"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Categorías */}
      {categories.length > 0 && (
        <div
          className="filter-row"
          role="group"
          aria-label="Filtrar por categoría"
        >
          <span className="filter-label">Categorías:</span>
          <button
            type="button"
            className={`chip filter-chip ${
              filters.categorySlug === "" ? "is-active" : ""
            }`}
            aria-pressed={filters.categorySlug === ""}
            onClick={() => onChange({ ...filters, categorySlug: "" })}
          >
            Todas
          </button>
          {categories.map((cat) => {
            const active = filters.categorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                className={`chip filter-chip ${active ? "is-active" : ""}`}
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    ...filters,
                    categorySlug: active ? "" : cat.slug,
                  })
                }
              >
                {cat.name}
                {typeof cat.productCount === "number" && (
                  <span className="chip-count"> {cat.productCount}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Marcas + solo nuevos */}
      {(brands.length > 1 || true) && (
        <div className="filter-row" role="group" aria-label="Más filtros">
          {brands.length > 1 && (
            <>
              <span className="filter-label">Marcas:</span>
              {brands.map((b) => {
                const active = filters.brandIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`chip filter-chip ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => toggleBrand(b.id)}
                  >
                    {b.name}
                  </button>
                );
              })}
            </>
          )}
          <button
            type="button"
            className={`chip filter-chip ${filters.onlyNew ? "is-active" : ""}`}
            aria-pressed={filters.onlyNew}
            onClick={() => onChange({ ...filters, onlyNew: !filters.onlyNew })}
          >
            Solo nuevos
          </button>
        </div>
      )}

      {resultCount !== null && (
        <p className="result-count muted" aria-live="polite">
          {resultCount} resultado(s)
        </p>
      )}
    </div>
  );
}
