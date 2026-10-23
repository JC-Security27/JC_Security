import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import { getDataClient, getActiveSource } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  SampleNotice,
} from "@/components/ui/states";
import type { Category } from "@/types/catalog";

/** Nombres legibles para los grupos (categoría padre). */
const GROUP_LABELS: Record<string, string> = {
  herramientas: "Herramientas",
  seguridad: "Seguridad",
  servicios: "Servicios",
};

function useHomeData() {
  return useAsync<{ categories: Category[] }>(async () => {
    const client = await getDataClient();
    const categories = await client.getCategories();
    return { categories };
  }, []);
}

/** Agrupa las categorías por su parentSlug, conservando el orden recibido. */
function groupByParent(categories: Category[]): [string, Category[]][] {
  const groups = new Map<string, Category[]>();
  const order: string[] = [];
  for (const cat of categories) {
    const key = cat.parentSlug ?? cat.slug;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(cat);
  }
  return order.map((k) => [k, groups.get(k)!]);
}

export function HomePage() {
  const { status, data, error, reload } = useHomeData();
  const showSampleNotice = getActiveSource() === "mock";

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
            <video
              className="hero-robot hero-robot-video"
              src="/robot-saludo.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
        </div>
      </section>

      {/* ----- Catálogo por categorías ----- */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">Catálogo</span>
          <h2>Explora por categorías</h2>
          <p>
            Encuentra productos organizados por categoría. Consulta precio y
            disponibilidad por WhatsApp.
          </p>
        </div>

        {showSampleNotice && (
          <SampleNotice>
            <strong>Contenido de muestra.</strong> Estás viendo datos de ejemplo
            para previsualizar el diseño.
          </SampleNotice>
        )}

        {status === "loading" && (
          <div style={{ marginTop: "var(--space-6)" }}>
            <CardsSkeleton />
          </div>
        )}
        {status === "error" && <ErrorState error={error} onRetry={reload} />}
        {status === "success" && data && (
          <div className="home-groups">
            {data.categories.length === 0 ? (
              <EmptyState title="Aún no hay categorías" />
            ) : (
              groupByParent(data.categories).map(([groupKey, subcats]) => (
                <section key={groupKey} className="home-group">
                  <div className="home-group-head">
                    <h3>{GROUP_LABELS[groupKey] ?? subcats[0]?.name ?? groupKey}</h3>
                  </div>
                  <div className="grid cat-grid">
                    {subcats.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categoria/${cat.slug}`}
                        className="card cat-card"
                      >
                        <span className="cat-card-name">{cat.name}</span>
                        {typeof cat.productCount === "number" && (
                          <span className="cat-card-count">
                            {cat.productCount} producto(s)
                          </span>
                        )}
                        <span className="cat-card-arrow" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
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
