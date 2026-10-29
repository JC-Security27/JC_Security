import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ParallaxBand } from "@/components/home/ParallaxBand";
import { GlassHero } from "@/components/home/GlassHero";
import { StoryScroll } from "@/components/home/StoryScroll";
import { useReveal } from "@/components/home/useReveal";

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
];

function OfferingCard({ offering }: { offering: Offering }) {
  return (
    <Link to={offering.to} className="card offering-card glass">
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
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="home-glass">
      {/* ----- Portada con efecto vidrio ----- */}
      <GlassHero />

      {/* ----- Historia con scroll: vigila, detecta, controla, conecta, equípate ----- */}
      <StoryScroll />

      {/* ----- Costa Rica de noche (parallax) ----- */}
      <ParallaxBand />

      {/* ----- Todo en un solo lugar: secciones y contacto ----- */}
      <section className="section container home-links">
        <div className="section-head reveal">
          <span className="eyebrow">JC Security</span>
          <h2>Todo en un solo lugar</h2>
          <p>Explora nuestras secciones o escríbenos directamente.</p>
        </div>
        <div className="grid offerings-grid home-links-grid">
          {[...offerings, ...contactOptions].map((o, i) => (
            <div key={o.to} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <OfferingCard offering={o} />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
