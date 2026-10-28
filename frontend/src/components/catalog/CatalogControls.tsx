import { useMemo, useState } from "react";
import { groupCategories } from "@/lib/categoryGroups";
import type { Brand, Category } from "@/types/catalog";

/* ==========================================================================
   Controles de filtro del catálogo (estilo tienda: panel con checkboxes).
   - Búsqueda por texto.
   - Categorías: agrupadas en familias desplegables (Herramientas, Cámaras…),
     cada una con casilla para elegir la familia completa.
   - Marcas: selección múltiple (checkbox) con mini-buscador y "ver más".
   - Solo nuevos.
   El layout (sidebar en escritorio / drawer en móvil) lo pone CatalogPage;
   este componente solo renderiza el contenido del panel.
   ========================================================================== */
/** Filtro "Solo productos nuevos": oculto de momento (pedido del usuario, 2026-10-27). */
export const SHOW_NEW_FILTER = false;

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
  onHide,
  hideLabel = "Ocultar filtros",
}: {
  categories: Category[];
  brands: Brand[];
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  /** Si se pasa, el título "Filtros" es un botón que oculta/cierra el panel. */
  onHide?: () => void;
  hideLabel?: string;
}) {
  const [brandQuery, setBrandQuery] = useState("");

  const toggleCategory = (slug: string) => {
    const set = new Set(filters.categorySlugs);
    set.has(slug) ? set.delete(slug) : set.add(slug);
    onChange({ ...filters, categorySlugs: [...set] });
  };

  // Familias de categorías desplegables. Una familia con algo elegido se abre
  // sola (salvo que el usuario la cierre); las demás arrancan cerradas.
  const groups = useMemo(() => groupCategories(categories), [categories]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string, isOpen: boolean) => {
    const nextOpen = new Set(open);
    const nextClosed = new Set(closed);
    if (isOpen) {
      nextOpen.delete(id);
      nextClosed.add(id);
    } else {
      nextOpen.add(id);
      nextClosed.delete(id);
    }
    setOpen(nextOpen);
    setClosed(nextClosed);
  };
  const toggleGroup = (slugs: string[], allSelected: boolean) => {
    const set = new Set(filters.categorySlugs);
    slugs.forEach((s) => (allSelected ? set.delete(s) : set.add(s)));
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
        {/* Botón junto al título: oculta el panel (escritorio) o cierra el
            cajón (celular). */}
        {onHide ? (
          <button
            type="button"
            className="filters-hide-btn"
            onClick={onHide}
            aria-label={hideLabel}
            title={hideLabel}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <h2 className="filters-title">Filtros</h2>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="filters-hide-icon">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        ) : (
          <h2 className="filters-title">Filtros</h2>
        )}
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

      {/* Categorías agrupadas en familias desplegables (pedido del usuario) */}
      {groups.length > 0 && (
        <div className="filter-group">
          <h3 className="filter-group-title">Categorías</h3>
          <ul className="filter-check-list filter-accordion">
            {groups.map((g) => {
              const selected = g.categories.filter((c) =>
                filters.categorySlugs.includes(c.slug)
              ).length;
              const all = selected === g.categories.length;
              const isOpen = open.has(g.id) || (selected > 0 && !closed.has(g.id));
              const panelId = `filtro-grupo-${g.id}`;
              return (
                <li key={g.id} className={`filter-acc ${isOpen ? "is-open" : ""}`}>
                  <div className="filter-acc-head">
                    <input
                      type="checkbox"
                      checked={all}
                      ref={(el) => {
                        if (el) el.indeterminate = selected > 0 && !all;
                      }}
                      onChange={() => toggleGroup(g.categories.map((c) => c.slug), all)}
                      aria-label={`Seleccionar todo ${g.name}`}
                    />
                    <button
                      type="button"
                      className="filter-acc-toggle"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleOpen(g.id, isOpen)}
                    >
                      <span className="filter-check-label">{g.name}</span>
                      <span className="filter-check-count">{g.productCount}</span>
                      <span className="filter-acc-caret" aria-hidden="true">▾</span>
                    </button>
                  </div>
                  {isOpen && (
                    <ul className="filter-acc-panel" id={panelId}>
                      {g.categories.map((cat) => (
                        <li key={cat.id}>
                          <label className="filter-check">
                            <input
                              type="checkbox"
                              checked={filters.categorySlugs.includes(cat.slug)}
                              onChange={() => toggleCategory(cat.slug)}
                            />
                            <span className="filter-check-label">{cat.name}</span>
                            {typeof cat.productCount === "number" && (
                              <span className="filter-check-count">{cat.productCount}</span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
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

      {/* Solo nuevos (deshabilitado de momento, pedido del usuario) */}
      {SHOW_NEW_FILTER && (
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
      )}
    </div>
  );
}
