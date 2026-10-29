import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { groupCatalogUrl } from "@/lib/categoryGroups";
import { siteConfig } from "@/config/site";
import { telHref } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo adaptive />
          <p>{siteConfig.shortDescription}</p>
        </div>

        <nav className="footer-col" aria-label="Catálogo">
          <h4>Catálogo</h4>
          <ul>
            <li>
              <Link to="/catalogo">Ver todo</Link>
            </li>
            <li>
              <Link to={groupCatalogUrl("camaras")}>Cámaras</Link>
            </li>
            <li>
              <Link to={groupCatalogUrl("alarmas")}>Alarmas</Link>
            </li>
            <li>
              <Link to={groupCatalogUrl("acceso")}>Control de acceso</Link>
            </li>
            <li>
              <Link to={groupCatalogUrl("redes")}>Redes</Link>
            </li>
            <li>
              <Link to={groupCatalogUrl("herramientas")}>Herramientas</Link>
            </li>
            <li>
              <Link to="/servicios">Servicios</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Secciones">
          <h4>Secciones</h4>
          <ul>
            <li>
              <Link to="/servicios">Servicios</Link>
            </li>
            <li>
              <Link to="/guias">Guías de seguridad</Link>
            </li>
            <li>
              <Link to="/contacto">Contacto</Link>
            </li>
          </ul>
        </nav>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul className="footer-contact">
            <li>
              {siteConfig.contact.phone ? (
                <a href={telHref(siteConfig.contact.phone)}>
                  Teléfono: {siteConfig.contact.phone}
                </a>
              ) : (
                <span className="muted">Teléfono: pendiente</span>
              )}
            </li>
            <li>
              {siteConfig.contact.email || (
                <span className="muted">Correo: pendiente</span>
              )}
            </li>
            <li>
              Alcance: {siteConfig.contact.scope}
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          © {year} {siteConfig.name}. Sitio en construcción — contenido de
          muestra mientras se incorpora la información oficial.
        </p>
      </div>
    </footer>
  );
}
