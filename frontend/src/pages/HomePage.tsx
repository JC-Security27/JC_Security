import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import { getDataClient } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";
import { BrandGroupedProducts } from "@/components/catalog/BrandGroupedProducts";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  SampleNotice,
} from "@/components/ui/states";
import type { Category, Product } from "@/types/catalog";

function useHomeData() {
  return useAsync<{ categories: Category[]; products: Product[] }>(async () => {
    const client = await getDataClient();
    const [categories, productsPage] = await Promise.all([
      client.getCategories(),
      client.getProducts({ pageSize: 100 }),
    ]);
    return { categories, products: productsPage.items };
  }, []);
}

export function HomePage() {
  const { status, data, error, reload } = useHomeData();

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
            <div className="hero-shield">
              <svg viewBox="0 0 220 240" width="100%" height="100%">
                <path
                  d="M110 12 L200 48 V120 C200 176 160 216 110 232 C60 216 20 176 20 120 V48 Z"
                  fill="var(--surface)"
                  stroke="var(--brand-mid)"
                  strokeWidth="3"
                />
                <circle cx="82" cy="110" r="12" fill="var(--brand-cyan)" />
                <circle cx="138" cy="110" r="12" fill="var(--brand-cyan)" />
                <path
                  d="M78 150 Q110 176 142 150"
                  fill="none"
                  stroke="var(--brand-cyan)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ----- Catálogo por categorías ----- */}
      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">Catálogo</span>
          <h2>Explora por categorías</h2>
          <p>
            Encuentra productos y servicios organizados por categoría y marca.
            Consulta precio y disponibilidad por WhatsApp.
          </p>
        </div>

        <SampleNotice>
          <strong>Contenido de muestra.</strong> El catálogo real se cargará
          cuando JC Security comparta sus catálogos en PDF. Los productos
          mostrados aquí son ejemplos para previsualizar el diseño.
        </SampleNotice>

        {status === "loading" && (
          <div style={{ marginTop: "var(--space-6)" }}>
            <CardsSkeleton />
          </div>
        )}
        {status === "error" && <ErrorState error={error} onRetry={reload} />}
        {status === "success" && data && (
          <div className="home-categories">
            {data.categories.length === 0 ? (
              <EmptyState title="Aún no hay categorías" />
            ) : (
              data.categories.map((cat) => {
                const items = data.products.filter(
                  (p) => p.categorySlug === cat.slug
                );
                if (items.length === 0) return null;
                return (
                  <section key={cat.id} className="home-category">
                    <div className="home-category-head">
                      <div>
                        <h3>{cat.name}</h3>
                        {cat.description && (
                          <p className="muted">{cat.description}</p>
                        )}
                      </div>
                      <Link
                        to={`/categoria/${cat.slug}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Ver categoría
                      </Link>
                    </div>
                    <BrandGroupedProducts products={items} />
                  </section>
                );
              })
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
