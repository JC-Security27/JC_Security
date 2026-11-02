import { Link, useParams } from "react-router-dom";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { siteConfig } from "@/config/site";
import { GUIDES, getGuide } from "@/data/guides";
import { GuideMedia } from "@/pages/GuidesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** Una guía de seguridad completa (/guias/:slug). */
export function GuidePage() {
  const { slug } = useParams();
  const guide = getGuide(slug);
  if (!guide) return <NotFoundPage />;

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const message = [
    `Hola ${siteConfig.name}, leí la guía "${guide.title}" y me gustaría recibir asesoría.`,
    "",
    "Gracias.",
  ].join("\n");

  return (
    <section className="section container guide-page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link to="/guias">Guías</Link>
        <span aria-hidden="true">/</span>
        <span>{guide.title}</span>
      </nav>

      <article className="guide-article">
        <header className="guide-header">
          <span className="chip chip-accent">{guide.tag}</span>
          <h1>{guide.title}</h1>
          <p className="guide-lead">{guide.summary}</p>
          <span className="muted guide-meta">Lectura de {guide.minutes} min</span>
        </header>

        <div className="card guide-cover" aria-hidden="true">
          <GuideMedia guide={guide} sizes="(max-width: 860px) 92vw, 760px" />
        </div>

        {guide.sections.map((s) => (
          <section key={s.title} className="guide-section">
            <h2>{s.title}</h2>
            {s.text && <p>{s.text}</p>}
            {s.items && (
              <ul>
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <aside className="card guide-cta">
          <div>
            <h2>¿Necesitas ayuda con esto?</h2>
            <p className="muted">
              Te asesoramos según tu casa o tu negocio. Estas guías son
              generales; para tu caso, consúltanos.
            </p>
          </div>
          <WhatsAppButton message={message} className="btn btn-whatsapp">
            Consultar por WhatsApp
          </WhatsAppButton>
        </aside>

        {guide.related.length > 0 && (
          <section className="guide-section">
            <h2>Relacionado</h2>
            <div className="guide-related">
              {guide.related.map((r) => (
                <Link key={r.label} to={r.to} className="chip guide-related-link">
                  {r.label} →
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <h2 className="services-list-title">Otras guías</h2>
      <div className="services-grid guides-grid">
        {others.map((g) => (
          <Link key={g.slug} to={`/guias/${g.slug}`} className="card service-card guide-card">
            <div className="service-card-media" aria-hidden="true">
              <GuideMedia
                guide={g}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
              />
            </div>
            <div className="service-card-body">
              <span className="chip chip-accent service-card-tag">{g.tag}</span>
              <h3 className="service-card-title">{g.title}</h3>
              <span className="guide-card-more">Leer guía · {g.minutes} min</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
