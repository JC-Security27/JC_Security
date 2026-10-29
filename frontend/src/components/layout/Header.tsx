import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useQuote } from "@/context/QuoteContext";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { HeaderDrip, HeaderGarland } from "@/components/layout/SeasonDecor";

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

  // Bloquea el scroll del body cuando el menú móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-logo" aria-label="Inicio — JC Security">
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
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
  );
}
