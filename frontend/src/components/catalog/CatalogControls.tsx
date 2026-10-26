import { useState } from "react";
import type { Brand, Category } from "@/types/catalog";

/* ==========================================================================
   Controles de filtro del catálogo (estilo tienda: panel con checkboxes).
   - Búsqueda por texto.
   - Categorías: selección múltiple (checkbox).
   - Marcas: selección múltiple (checkbox) con mini-buscador y "ver más".
   - Solo nuevos.
   El layout (sidebar en escritorio / drawer en móvil) lo pone CatalogPage;
   este componente solo renderiza el contenido del panel.
   ========================================================================== */
export interface CatalogFilters {
  search: string;
  categorySlugs: string[]; // vacío = todas
  brandIds: string[];
  onlyNew: boolean;
}

export const EMPTY_FILTERS: CatalogFilters = {
  search: "",
  categorySlugs: [],
  brandIds: [],
  onlyNew: false,
};

/** A partir de cuántas marcas mostramos el mini-buscador de marcas. */
const BRANDS_SEARCH_THRESHOLD = 8;

export function CatalogControls({
  categories,
  brands,
  filters,
  onChange,
}: {
  categories: Category[];
  brands: Brand[];
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}) {
  const [brandQuery, setBrandQuery] = useState("");

  const toggleCategory = (slug: string) => {
    const set = new Set(filters.categorySlugs);
    set.has(slug) ? set.delete(slug) : set.add(slug);
    onChange({ ...filters, categorySlugs: [...set] });
  };

  const toggleBrand = (id: string) => {
    const set = new Set(filters.brandIds);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange({ ...filters, brandIds: [...set] });
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.categorySlugs.length > 0 ||
    filters.brandIds.length > 0 ||
    filters.onlyNew;

  // Filtro del mini-buscador de marcas. Se muestran TODAS las marcas (con
  // scroll interno en la lista); el mini-buscador solo ayuda a encontrar una.
  const q = brandQuery.trim().toLowerCase();
  const visibleBrands = q
    ? brands.filter((b) => b.name.toLowerCase().includes(q))
    : brands;

  return (
    <div className="filters-panel">
      <div className="filters-panel-head">
        <h2 className="filters-title">Filtros</h2>
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="filters-search">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          className="search-icon"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar producto o referencia…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label="Buscar productos"
        />
      </div>

      {/* Categorías (checkbox múltiple) */}
      {categories.length > 0 && (
        <div className="filter-group">
          <h3 className="filter-group-title">Categorías</h3>
          <ul className="filter-check-list">
            {categories.map((cat) => {
              const checked = filters.categorySlugs.includes(cat.slug);
              return (
                <li key={cat.id}>
                  <label className="filter-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    <span className="filter-check-label">{cat.name}</span>
                    {typeof cat.productCount === "number" && (
                      <span className="filter-check-count">{cat.productCount}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Marcas (checkbox múltiple) con mini-buscador y ver más */}
      {brands.length > 0 && (
        <div className="filter-group">
          <h3 className="filter-group-title">Marcas</h3>
          {brands.length > BRANDS_SEARCH_THRESHOLD && (
            <input
              type="search"
              className="filter-brand-search"
              placeholder="Filtrar marcas…"
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              aria-label="Filtrar marcas"
            />
          )}
          <ul className="filter-check-list">
            {visibleBrands.map((b) => {
              const checked = filters.brandIds.includes(b.id);
              return (
                <li key={b.id}>
                  <label className="filter-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(b.id)}
                    />
                    <span className="filter-check-label">{b.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {q && visibleBrands.length === 0 && (
            <p className="muted filter-empty">Sin marcas que coincidan.</p>
          )}
        </div>
      )}

      {/* Solo nuevos */}
      <div className="filter-group">
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.onlyNew}
            onChange={() => onChange({ ...filters, onlyNew: !filters.onlyNew })}
          />
          <span className="filter-check-label">Solo productos nuevos</span>
        </label>
      </div>
    </div>
  );
}
