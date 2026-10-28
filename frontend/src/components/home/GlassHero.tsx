import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";
import { STORY, YEARS_OF_EXPERIENCE } from "@/components/home/homeStory";

/* Productos que flotan alrededor del robot (uno por capítulo de la historia). */
const FLOATING = [STORY[0].products[1], STORY[1].products[0], STORY[2].products[0], STORY[4].products[0]];

/**
 * Portada con efecto vidrio (glassmorphism): fondo con luces de color que se
 * mueven despacio, el robot de JC Security y tarjetas de vidrio con productos
 * reales flotando alrededor.
 */
export function GlassHero() {
  return (
    <section className="ghero">
      <div className="ghero-aurora" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>

      <div className="container ghero-inner">
        <div className="ghero-copy">
          <span className="ghero-badge glass">
            <strong>{YEARS_OF_EXPERIENCE} años</strong> protegiendo hogares y
            negocios en Costa Rica
          </span>
          <h1>{siteConfig.tagline}</h1>
          <p>{siteConfig.shortDescription}</p>
          <div className="ghero-actions">
            <Link to="/catalogo" className="btn btn-primary">
              Explorar catálogo
            </Link>
            <WhatsAppButton message={generalContactMessage()}>
              Consultar por WhatsApp
            </WhatsAppButton>
          </div>
          <ul className="ghero-trust">
            <li>
              <strong>{YEARS_OF_EXPERIENCE}</strong>
              <span>años de experiencia</span>
            </li>
            <li>
              <strong>+1.600</strong>
              <span>productos</span>
            </li>
            <li>
              <strong>+30</strong>
              <span>marcas</span>
            </li>
          </ul>
        </div>

        <div className="ghero-visual" aria-hidden="true">
          <span className="ghero-ring" />
          <img src="/robot-saludando.png" alt="" className="ghero-robot" />
          {FLOATING.map((p, i) => (
            <span key={p.id} className={`ghero-chip glass chip-${i}`}>
              <img src={p.img} alt="" loading="eager" />
              <span>{p.name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
