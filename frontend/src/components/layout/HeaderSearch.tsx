import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getDataClient } from "@/data/dataClient";
import { matchesSearch } from "@/lib/search";
import { groupByVariants, getVariantShortLabel } from "@/lib/variants";
import { toDisplayName } from "@/lib/format";
import type { Product } from "@/types/catalog";

/**
 * Barra de búsqueda del encabezado, automática (pedido del usuario):
 * - En el catálogo, filtra los productos mientras se escribe; al borrar,
 *   vuelve a mostrar todo.
 * - En las demás páginas, muestra sugerencias mientras se escribe (con
 *   sinónimos: "brida" -> gaza) y un enlace a todos los resultados.
 */

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 200;

// El catálogo se pide una sola vez (al primer foco) y se reutiliza.
let catalogPromise: Promise<Product[]> | null = null;
function loadCatalog(): Promise<Product[]> {
  if (!catalogPromise) {
    catalogPromise = getDataClient()
      .then((c) => c.getProducts({ pageSize: 5000 }))
      .then((page) => page.items)
      .catch((e) => {
        catalogPromise = null; // reintenta en el próximo foco
        throw e;
      });
  }
  return catalogPromise;
}

export function HeaderSearch({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const onCatalog = location.pathname === "/catalogo";
  const [value, setValue] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLFormElement>(null);
  const listId = useId();

  // En el catálogo la barra refleja lo que se está buscando (salvo mientras
  // se escribe en ella, para no pisar lo que el usuario teclea).
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setValue(onCatalog ? searchParams.get("q") ?? "" : "");
  }, [onCatalog, searchParams]);

  // Se precarga el catálogo cuando el navegador está libre, para que las
  // sugerencias salgan al instante al empezar a escribir.
  useEffect(() => {
    const t = setTimeout(() => {
      loadCatalog().then(setProducts).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Al cambiar de página se cierran las sugerencias.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Espera un momento después de la última tecla antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  // En el catálogo: los resultados se actualizan solos mientras se escribe.
  useEffect(() => {
    if (!onCatalog || document.activeElement !== inputRef.current) return;
    const current = searchParams.get("q") ?? "";
    if (current === debounced) return;
    const params = new URLSearchParams(searchParams);
    if (debounced.trim()) params.set("q", debounced);
    else params.delete("q");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, onCatalog]);

  // Cierra las sugerencias al hacer clic fuera.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const startLoading = () => {
    if (products) return;
    loadCatalog().then(setProducts).catch(() => setProducts(null));
  };

  // Sugerencias: un resultado por artículo (las medidas de un mismo producto
  // van juntas), máximo MAX_SUGGESTIONS.
  const { suggestions, total } = useMemo(() => {
    const q = debounced.trim();
    if (!q || !products) return { suggestions: [], total: 0 };
    const groups = groupByVariants(products.filter((p) => matchesSearch(p, q)));
    return { suggestions: groups.slice(0, MAX_SUGGESTIONS), total: groups.length };
  }, [debounced, products]);

  const showList = open && !onCatalog && debounced.trim() !== "";

  const goToCatalog = () => {
    const q = value.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
    setOpen(false);
    inputRef.current?.blur();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (showList && active >= 0 && suggestions[active]) {
      navigate(`/producto/${suggestions[active].representative.id}`);
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (onCatalog) {
      inputRef.current?.blur();
      return; // ya se está filtrando en vivo
    }
    goToCatalog();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  return (
    <form
      ref={boxRef}
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
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Buscar productos, marcas o códigos…"
        value={value}
        onFocus={() => {
          startLoading();
          setOpen(true);
        }}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        aria-label="Buscar productos"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      <button type="submit" className="header-search-btn">
        Buscar
      </button>

      {showList && (
        <div className="search-suggest" id={listId} role="listbox">
          {!products ? (
            <p className="search-suggest-empty">Cargando productos…</p>
          ) : suggestions.length === 0 ? (
            <p className="search-suggest-empty">
              No encontramos productos para “{debounced.trim()}”.
            </p>
          ) : (
            <>
              <ul>
                {suggestions.map((g, i) => {
                  const p = g.representative;
                  const img = p.images[0];
                  return (
                    <li key={p.id} role="option" aria-selected={i === active}>
                      <Link
                        to={`/producto/${p.id}`}
                        className={`search-suggest-item ${i === active ? "is-active" : ""}`}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => setOpen(false)}
                      >
                        <span className="search-suggest-img">
                          {img && <img src={img.url} alt="" loading="lazy" />}
                        </span>
                        <span className="search-suggest-text">
                          <span className="search-suggest-name">
                            {toDisplayName(p.name)}
                          </span>
                          <span className="search-suggest-meta">
                            {[
                              p.brandName,
                              g.hasVariants
                                ? `${g.variants.length} ${getVariantShortLabel(g)}`
                                : `Ref: ${p.reference}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="search-suggest-all"
                onClick={goToCatalog}
              >
                Ver {total === 1 ? "el resultado" : `los ${total} resultados`} →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
