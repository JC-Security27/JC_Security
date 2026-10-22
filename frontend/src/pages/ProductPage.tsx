import { Link, useParams } from "react-router-dom";
import { getDataClient } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import { useQuote } from "@/context/QuoteContext";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { productInquiryMessage } from "@/lib/whatsapp";
import { toDisplayName } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SampleNotice,
} from "@/components/ui/states";
import type { Product } from "@/types/catalog";

export function ProductPage() {
  const { id = "" } = useParams();
  const { add, has } = useQuote();

  const { status, data, error, reload } = useAsync<Product | null>(async () => {
    const client = await getDataClient();
    return client.getProductById(id);
  }, [id]);

  if (status === "loading") {
    return (
      <section className="section container">
        <LoadingState label="Cargando producto…" />
      </section>
    );
  }
  if (status === "error") {
    return (
      <section className="section container">
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }
  if (!data) {
    return (
      <section className="section container">
        <EmptyState title="Producto no encontrado">
          <Link to="/catalogo">Volver al catálogo</Link>
        </EmptyState>
      </section>
    );
  }

  const product = data;
  const img = product.images[0];
  const inList = has(product.id);
  const specs = product.specs ? Object.entries(product.specs) : [];

  return (
    <section className="section container">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/catalogo">Catálogo</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/categoria/${product.categorySlug}`}>
          {product.categorySlug}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{toDisplayName(product.name)}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail-media card">
          {img ? (
            <img
              src={img.url}
              alt={img.alt}
              width={img.width}
              height={img.height}
            />
          ) : (
            <div className="product-card-noimg">Sin imagen</div>
          )}
          {product.isSample && <span className="sample-tag">Muestra</span>}
        </div>

        <div className="product-detail-info">
          <div className="product-card-meta">
            {product.brandName && (
              <span className="chip chip-accent">{product.brandName}</span>
            )}
            {product.isService && <span className="chip">Servicio</span>}
          </div>
          <h1>{toDisplayName(product.name)}</h1>
          <p className="product-ref-lg">Referencia: {product.reference}</p>

          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          {/* Sin precios: se consulta por WhatsApp */}
          <div className="price-box">
            <p>
              <strong>Precio y disponibilidad</strong> se consultan directamente
              con JC Security.
            </p>
            <div className="product-detail-actions">
              <WhatsAppButton message={productInquiryMessage(product)}>
                Consultar por WhatsApp
              </WhatsAppButton>
              <button
                type="button"
                className={`btn ${inList ? "btn-ghost" : "btn-outline"}`}
                onClick={() => add(product)}
                aria-pressed={inList}
              >
                {inList ? "En tu lista ✓" : "Agregar a la lista"}
              </button>
            </div>
            {inList && (
              <p className="muted" style={{ marginTop: "var(--space-2)" }}>
                <Link to="/cotizacion">Ver lista de cotización →</Link>
              </p>
            )}
          </div>

          {specs.length > 0 && (
            <div className="specs">
              <h2>Características</h2>
              <dl className="specs-list">
                {specs.map(([k, v]) => (
                  <div key={k} className="specs-row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.isSample && (
            <SampleNotice>
              <strong>Dato de muestra.</strong> Este producto es un ejemplo. La
              información oficial (imagen, características y disponibilidad) se
              cargará desde el catálogo de JC Security.
            </SampleNotice>
          )}
        </div>
      </div>
    </section>
  );
}
