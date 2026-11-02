import { Link } from "react-router-dom";
import { PageHero } from "@/components/ui/RobotStage";
import { GUIDES, type Guide, type GuideIcon } from "@/data/guides";

const GUIDE_IMG = "https://xehegspjlbpkvhsgcdqj.supabase.co/storage/v1/object/public/catalogo/";

/* Íconos para las guías sin foto. */
const GUIDE_ICONS: Record<GuideIcon, JSX.Element> = {
  building: (
    <>
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <path d="M3 21h18M8 8h3M8 12h3M8 16h3" />
    </>
  ),
  flame: (
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5.5 1-8.5Z" />
  ),
  battery: (
    <>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21 11v2M11 9l-2 3h4l-2 3" />
    </>
  ),
};

/** Foto de la guía (fotos de Servicios) o su ícono sobre el color del tema. */
export function GuideMedia({ guide, sizes }: { guide: Guide; sizes: string }) {
  if (guide.image) {
    return (
      <img
        src={`/servicios/${guide.image}-800.webp`}
        srcSet={[480, 800, 1200]
          .map((w) => `/servicios/${guide.image}-${w}.webp ${w}w`)
          .join(", ")}
        sizes={sizes}
        alt=""
        loading="lazy"
        decoding="async"
        style={guide.imagePosition ? { objectPosition: guide.imagePosition } : undefined}
      />
    );
  }
  return (
    <span className="guide-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {guide.icon && GUIDE_ICONS[guide.icon]}
      </svg>
    </span>
  );
}

export function GuidesPage() {
  return (
    <section className="section container">
      <PageHero
        eyebrow="Recursos"
        title="Guías de seguridad"
        robot="guias"
        chips={[
          { label: "Seguridad en el hogar", img: `${GUIDE_IMG}ajax-bkeypadtouch-hq.webp` },
          { label: "Seguridad para negocios", img: `${GUIDE_IMG}zkteco-horustl2-hq.webp` },
          { label: "Mantenimiento de cámaras", img: `${GUIDE_IMG}dahua-ipchfw2449tzasil-hq.webp` },
          { label: "Detección de incendio", img: `${GUIDE_IMG}ajax-bfireprotect2rb-hq.webp` },
        ]}
      >
        <p>
          Consejos y guías prácticas para proteger tu hogar y tu negocio.
        </p>
      </PageHero>

      <div className="services-grid guides-grid">
        {GUIDES.map((g) => (
          <Link key={g.slug} to={`/guias/${g.slug}`} className="card service-card guide-card">
            <div className="service-card-media" aria-hidden="true">
              <GuideMedia
                guide={g}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 25vw"
              />
            </div>
            <div className="service-card-body">
              <span className="chip chip-accent service-card-tag">{g.tag}</span>
              <h3 className="service-card-title">{g.title}</h3>
              <p className="muted service-card-desc">{g.summary}</p>
              <span className="guide-card-more">
                Leer guía · {g.minutes} min
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
