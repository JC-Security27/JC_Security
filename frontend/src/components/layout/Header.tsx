import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useQuote } from "@/context/QuoteContext";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { SocialIcons } from "@/components/layout/SocialIcons";
import {
  CornerCartWheels,
  CornerFireworks,
  CornerWebs,
  HeaderBunting,
  HeaderDrip,
  HeaderGarland,
  NewYearCountdown,
} from "@/components/layout/SeasonDecor";

const navItems = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/servicios", label: "Servicios" },
  { to: "/guias", label: "Guías" },
  { to: "/contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useQuote();
  const location = useLocation();

  // Cierra el menú móvil al cambiar de ruta.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // El encabezado va fijo arriba de la pantalla (en celular "sticky" se
  // perdía al bajar y al abrir el menú). Un espaciador con su alto real
  // evita que tape el contenido; el alto cambia en celular (fila de
  // búsqueda) y se mide con ResizeObserver.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // El menú móvil abierto no cuenta: solo la barra.
    const update = () => {
      const menu = el.querySelector<HTMLElement>("#mobile-nav");
      const h = el.offsetHeight - (menu?.offsetHeight ?? 0);
      document.documentElement.style.setProperty("--header-offset", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bloquea el scroll del body cuando el menú móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Con el menú abierto: Esc lo cierra, y si la pantalla pasa a tamaño de
  // computadora (por ejemplo al girar la tablet) también, para que no quede
  // el scroll bloqueado sin menú a la vista.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 861px)");
    const onWide = () => {
      if (mq.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  // Tocar la barra del encabezado fuera del menú y de la X (logo, búsqueda,
  // carrito…) también cierra el menú. La X sigue abriendo y cerrando.
  const closeOnOutsideTap = (e: React.PointerEvent<HTMLElement>) => {
    if (!open) return;
    const target = e.target as HTMLElement;
    if (target.closest("#mobile-nav") || target.closest(".burger")) return;
    setOpen(false);
  };

  return (
    <>
      <div className="header-spacer" aria-hidden="true" />
      {/* Fondo tocable: tocar cualquier parte de la página cierra el menú
          móvil sin activar lo que haya debajo. Va fuera del <header> porque
          éste tiene backdrop-filter y limitaría un elemento fijo a su caja. */}
      {open && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <header
        className="site-header"
        ref={headerRef}
        onPointerDown={closeOnOutsideTap}
      >
        <div className="container header-inner">
          <Link
            to="/"
            className="header-logo"
            aria-label="Inicio — JC Security"
          >
            <Logo />
          </Link>

          <nav
            className={`main-nav ${open ? "is-open" : ""}`}
            aria-label="Navegación principal"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <SocialIcons className="nav-socials" />
          </nav>

          <HeaderSearch className="header-search-desktop" />

          <div className="header-actions">
            <Link
              to="/cotizacion"
              className="quote-pill"
              aria-label={`Lista de cotización, ${count} artículo(s)`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M4 5h2l2.2 10.2a1 1 0 0 0 1 .8h7.6a1 1 0 0 0 1-.8L20 8H7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="20" r="1.6" fill="currentColor" />
                <circle cx="17" cy="20" r="1.6" fill="currentColor" />
              </svg>
              {count > 0 && <span className="quote-badge">{count}</span>}
            </Link>

            <button
              type="button"
              className={`burger ${open ? "is-open" : ""}`}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <HeaderGarland />
        <HeaderDrip />
        <HeaderBunting />
        <CornerWebs />
        <CornerCartWheels />
        <CornerFireworks />
        <NewYearCountdown />

        {/* Búsqueda en móvil: segunda fila del encabezado, siempre visible */}
        <div className="container header-search-row">
          <HeaderSearch />
        </div>

        {/* Menú móvil desplegable */}
        <div
          id="mobile-nav"
          className={`mobile-nav ${open ? "is-open" : ""}`}
          hidden={!open}
        >
          <nav aria-label="Navegación móvil">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mobile-link ${isActive ? "is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <SocialIcons className="mobile-socials" />
          </nav>
        </div>
      </header>
    </>
  );
}
