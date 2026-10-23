import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";

/* Secciones que ofrece JC Security, mostradas como tarjetas en la portada.
   Cada una lleva a su sección (las mismas del menú superior). */
interface Offering {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}

/* Sección 1: lo que ofrecemos (productos / contenido). */
const offerings: Offering[] = [
  {
    to: "/catalogo",
    title: "Catálogo de productos",
    description:
      "Herramientas y equipos de seguridad organizados por categoría y marca.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: "/servicios",
    title: "Servicios",
    description:
      "Instalaciones y servicios de seguridad realizados por JC Security.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/guias",
    title: "Guías de seguridad",
    description: "Consejos prácticos para proteger tu hogar y tu negocio.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          d="M12 3 20 6v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/* Sección 2: contáctanos (contacto / redes). */
const contactOptions: Offering[] = [
  {
    to: "/contacto",
    title: "Contacto",
    description:
      "Escríbenos por WhatsApp para precio, disponibilidad y asesoría.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          d="M4 5h16v12H7l-3 3V5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/redes",
    title: "Redes sociales",
    description: "Síguenos para novedades, promociones y lanzamientos.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="18" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8.2 11 15 7M8.2 13 15 17" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

function OfferingCard({ offering }: { offering: Offering }) {
  return (
    <Link to={offering.to} className="card offering-card">
      <span className="offering-icon" aria-hidden="true">
        {offering.icon}
      </span>
      <span className="offering-body">
        <span className="offering-title">{offering.title}</span>
        <span className="offering-desc">{offering.description}</span>
      </span>
      <span className="offering-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export function HomePage() {
  return (
    <>
      {/* ----- Hero ----- */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">{siteConfig.name}</span>
            <h1>{siteConfig.tagline}</h1>
            <p>{siteConfig.shortDescription}</p>
            <div className="hero-actions">
              <Link to="/catalogo" className="btn btn-primary">
                Explorar catálogo
              </Link>
              <WhatsAppButton message={generalContactMessage()}>
                Consultar por WhatsApp
              </WhatsAppButton>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <img src="/robot-saludando.png" alt="" className="hero-robot" />
          </div>
        </div>
      </section>

      {/* ----- Lo que ofrecemos ----- */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">JC Security</span>
          <h2>Lo que ofrecemos</h2>
          <p>
            Explora nuestras áreas. Entra a cada una para ver todo lo que
            tenemos disponible.
          </p>
        </div>

        <div className="grid offerings-grid">
          {offerings.map((o) => (
            <OfferingCard key={o.to} offering={o} />
          ))}
        </div>
      </section>

      {/* ----- Contáctanos ----- */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">¿Hablamos?</span>
          <h2>Contáctanos</h2>
          <p>Estamos para ayudarte. Elige cómo prefieres comunicarte.</p>
        </div>

        <div className="grid offerings-grid">
          {contactOptions.map((o) => (
            <OfferingCard key={o.to} offering={o} />
          ))}
        </div>
      </section>

      {/* ----- Franja WhatsApp ----- */}
      <section className="cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>¿Buscas algo específico?</h2>
            <p>
              Escríbenos por WhatsApp con la referencia o el nombre del producto
              y te ayudamos con precio y disponibilidad.
            </p>
          </div>
          <WhatsAppButton message={generalContactMessage()}>
            Escribir por WhatsApp
          </WhatsAppButton>
        </div>
      </section>
    </>
  );
}
