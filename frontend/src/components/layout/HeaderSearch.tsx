import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Barra de búsqueda del encabezado: lleva al catálogo con ?q=<término>.
 * El catálogo ya filtra por ese parámetro (nombre, referencia y marca, sin tildes).
 */
export function HeaderSearch({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const onCatalog = location.pathname === "/catalogo";
  const [value, setValue] = useState("");

  // En el catálogo la barra muestra lo que se está buscando; fuera de él queda vacía.
  useEffect(() => {
    setValue(onCatalog ? searchParams.get("q") ?? "" : "");
  }, [onCatalog, searchParams]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (onCatalog) {
      // Conserva los demás filtros (categorías, marcas) y cambia solo el término.
      const params = new URLSearchParams(searchParams);
      if (q) params.set("q", q);
      else params.delete("q");
      navigate(`/catalogo?${params.toString()}`);
    } else {
      navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
    }
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <form
      role="search"
      className={`header-search ${className}`}
      onSubmit={submit}
    >
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
        enterKeyHint="search"
        placeholder="Buscar productos, marcas o códigos…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Buscar productos"
      />
      <button type="submit" className="header-search-btn">
        Buscar
      </button>
    </form>
  );
}
