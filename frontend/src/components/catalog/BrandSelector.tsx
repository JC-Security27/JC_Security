import type { Brand } from "@/types/catalog";
import { getBrandLogo, getBrandLogoFit } from "@/config/brandLogos";

/* Selector de marca con logo. Muestra una tarjeta "Todas" + una por marca.
   Si la marca tiene logo, se muestra sobre una tarjeta blanca (los logos
   suelen venir sobre blanco); si no, se muestra el nombre. Selección única:
   al tocar una marca filtra por ella; "Todas" las muestra juntas. */
export function BrandSelector({
  brands,
  selectedBrandIds,
  onChange,
}: {
  brands: Brand[];
  selectedBrandIds: string[];
  onChange: (brandIds: string[]) => void;
}) {
  if (brands.length === 0) return null;

  const allSelected = selectedBrandIds.length === 0;

  const selectOne = (id: string) => {
    // Selección única por marca (toca de nuevo para quitar -> "Todas").
    if (selectedBrandIds.length === 1 && selectedBrandIds[0] === id) {
      onChange([]);
    } else {
      onChange([id]);
    }
  };

  return (
    <div className="brand-selector" role="group" aria-label="Filtrar por marca">
      <button
        type="button"
        className={`brand-tile ${allSelected ? "is-active" : ""}`}
        aria-pressed={allSelected}
        onClick={() => onChange([])}
      >
        <span className="brand-tile-all">Todas las marcas</span>
      </button>

      {brands.map((b) => {
        const logo = getBrandLogo(b);
        const fit = getBrandLogoFit(b);
        const active = selectedBrandIds.includes(b.id);
        return (
          <button
            key={b.id}
            type="button"
            className={`brand-tile ${active ? "is-active" : ""} ${
              logo ? "has-logo" : ""
            }`}
            aria-pressed={active}
            onClick={() => selectOne(b.id)}
            title={b.name}
          >
            {logo ? (
              <span className="brand-tile-logo">
                <img
                  src={logo}
                  alt={b.name}
                  loading="lazy"
                  style={{ objectFit: fit }}
                />
              </span>
            ) : (
              <span className="brand-tile-name">{b.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
