import type { Brand } from "@/types/catalog";

/* Controles de búsqueda y filtros del catálogo. Permite combinar búsqueda por
   referencia/nombre/marca con filtros por marca, y limpiar todo. */
export interface CatalogFilters {
  search: string;
  brandIds: string[];
}

export function CatalogControls({
  brands,
  filters,
  onChange,
  resultCount,
}: {
  brands: Brand[];
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  resultCount: number | null;
}) {
  const hasActiveFilters =
    filters.search.trim() !== "" || filters.brandIds.length > 0;

  const toggleBrand = (id: string) => {
    const set = new Set(filters.brandIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...filters, brandIds: [...set] });
  };

  return (
    <div className="catalog-controls">
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
            onClick={() => onChange({ search: "", brandIds: [] })}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {brands.length > 0 && (
        <div className="filter-row" role="group" aria-label="Filtrar por marca">
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
