import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { generalContactMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>{siteConfig.shortDescription}</p>
          <WhatsAppButton
            message={generalContactMessage()}
            className="btn btn-whatsapp btn-sm"
          >
            Escríbenos
          </WhatsAppButton>
        </div>

        <nav className="footer-col" aria-label="Catálogo">
          <h4>Catálogo</h4>
          <ul>
            <li>
              <Link to="/catalogo">Ver todo</Link>
            </li>
            <li>
              <Link to="/categoria/camaras">Cámaras</Link>
            </li>
            <li>
              <Link to="/categoria/redes">Redes</Link>
            </li>
            <li>
              <Link to="/categoria/herramientas">Herramientas</Link>
            </li>
            <li>
              <Link to="/categoria/servicios">Servicios</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Secciones">
          <h4>Secciones</h4>
          <ul>
            <li>
              <Link to="/proyectos">Proyectos</Link>
            </li>
            <li>
              <Link to="/guias">Guías de seguridad</Link>
            </li>
            <li>
              <Link to="/redes">Redes sociales</Link>
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
              {siteConfig.contact.phone || (
                <span className="muted">Teléfono: pendiente</span>
              )}
            </li>
            <li>
              {siteConfig.contact.email || (
                <span className="muted">Correo: pendiente</span>
              )}
            </li>
            <li>
              {siteConfig.contact.address || (
                <span className="muted">Dirección: pendiente</span>
              )}
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
