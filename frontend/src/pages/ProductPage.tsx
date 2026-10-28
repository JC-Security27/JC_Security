import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDataClient } from "@/data/dataClient";
import { useAsync } from "@/hooks/useAsync";
import { useQuote } from "@/context/QuoteContext";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { productInquiryMessage } from "@/lib/whatsapp";
import { toDisplayName, displaySpecs } from "@/lib/format";
import {
  groupByVariants,
  getSizeLabel,
  getVariantLabel,
} from "@/lib/variants";
import { BackButton } from "@/components/ui/BackButton";
import { ProductImage } from "@/components/catalog/ProductImage";
import { ProductCarousel } from "@/components/catalog/ProductCarousel";
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
  const [sizesOpen, setSizesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Cargamos el producto y los de su categoría (para detectar variantes de talla).
  const { status, data, error, reload } = useAsync<{
    product: Product | null;
    siblings: Product[];
  }>(async () => {
    const client = await getDataClient();
    const product = await client.getProductById(id);
    if (!product) return { product: null, siblings: [] };
    const page = await client.getProducts({
      categorySlug: product.categorySlug,
      pageSize: 1000,
    });
    return { product, siblings: page.items };
  }, [id]);

  // Grupo de variantes al que pertenece este producto.
  const group = useMemo(() => {
    if (!data?.product) return null;
    const groups = groupByVariants(data.siblings);
    return (
      groups.find((g) =>
        g.variants.some((v) => v.id === data.product!.id)
      ) ?? null
    );
  }, [data]);

  // Productos relacionados: otros de la misma categoría (sin el actual).
  // Hasta 12, en una fila horizontal que se desliza (carrusel).
  const RELATED_LIMIT = 12;
  const related = useMemo(() => {
    if (!data?.product) return [];
    const currentId = data.product.id;
    return groupByVariants(data.siblings)
      .filter((g) => !g.variants.some((v) => v.id === currentId))
      .slice(0, RELATED_LIMIT);
  }, [data]);

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
  if (!data?.product) {
    return (
      <section className="section container">
        <EmptyState title="Producto no encontrado">
          <Link to="/catalogo">Volver al catálogo</Link>
        </EmptyState>
      </section>
    );
  }

  const product = data.product;
  const inList = has(product.id);
  const hasVariants = group?.hasVariants ?? false;

  // Variante elegida (o el propio producto si no se eligió ninguna).
  const selectedVariant =
    (selectedId && group?.variants.find((v) => v.id === selectedId)) ||
    product;

  // La foto sigue a la medida elegida (cada medida de una herramienta tiene su foto).
  // En prendas y calzado todas las tallas comparten la misma foto desde el backend.
  const img = selectedVariant.images[0] ?? product.images[0];

  // Las specs a mostrar son las de la variante seleccionada, limpiadas:
  // "Código Intrade" -> "Código" y sin cantidades por caja (venta por unidad).
  const specs = displaySpecs(selectedVariant.specs);

  return (
    <section className="section container">
      <div className="detail-topbar">
        <BackButton fallback="/catalogo" />
      </div>
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
          <ProductImage image={img} alt={toDisplayName(product.name)} />
          {product.isSample && <span className="sample-tag">Muestra</span>}
        </div>

        <div className="product-detail-info">
          <div className="product-card-meta">
            {product.brandName && (
              <span className="chip chip-accent">{product.brandName}</span>
            )}
            {product.isService && <span className="chip">Servicio</span>}
            {product.isNew && <span className="chip chip-accent">Nuevo</span>}
          </div>
          <h1>{toDisplayName(product.name)}</h1>
          <p className="product-ref-lg">
            Referencia: {selectedVariant.reference}
          </p>

          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          {product.sourceUrl && (
            <p className="product-source">
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ficha del fabricante ↗
              </a>
            </p>
          )}

          {/* ----- Tallas disponibles (solo si hay variantes de tamaño) ----- */}
          {hasVariants && group && (
            <div className="sizes">
              <button
                type="button"
                className="sizes-toggle"
                aria-expanded={sizesOpen}
                onClick={() => setSizesOpen((v) => !v)}
              >
                <span>
                  {getVariantLabel(group)} ({group.variants.length})
                </span>
                <span className={`sizes-caret ${sizesOpen ? "open" : ""}`}>
                  ▾
                </span>
              </button>
              {sizesOpen && (
                <ul className="sizes-list">
                  {group.variants.map((v) => {
                    const label = getSizeLabel(v) ?? v.reference;
                    const active = v.id === selectedVariant.id;
                    return (
                      <li key={v.id}>
                        <button
                          type="button"
                          className={`size-option ${active ? "is-active" : ""}`}
                          onClick={() => setSelectedId(v.id)}
                        >
                          <span className="size-label">{label}</span>
                          <span className="size-ref">Ref: {v.reference}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Características del producto (arriba del bloque de precio). */}
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

          {/* Sin precios: se consulta por WhatsApp */}
          <div className="price-box">
            <p>
              <strong>Precio y disponibilidad</strong> se consultan directamente
              con JC Security.
            </p>
            <div className="product-detail-actions">
              <WhatsAppButton message={productInquiryMessage(selectedVariant)}>
                Consultar por WhatsApp
              </WhatsAppButton>
              <button
                type="button"
                className={`btn ${
                  has(selectedVariant.id) ? "btn-ghost" : "btn-outline"
                }`}
                onClick={() => add(selectedVariant)}
                aria-pressed={has(selectedVariant.id)}
              >
                {has(selectedVariant.id)
                  ? "En tu lista ✓"
                  : hasVariants
                  ? "Agregar opción a la lista"
                  : "Agregar a la lista"}
              </button>
            </div>
            {hasVariants && (
              <p className="muted" style={{ marginTop: "var(--space-2)" }}>
                Se agregará la opción seleccionada
                {getSizeLabel(selectedVariant)
                  ? ` (${getSizeLabel(selectedVariant)})`
                  : ` (Ref: ${selectedVariant.reference})`}
                .
              </p>
            )}
            {inList && !hasVariants && (
              <p className="muted" style={{ marginTop: "var(--space-2)" }}>
                <Link to="/cotizacion">Ver lista de cotización →</Link>
              </p>
            )}
          </div>

          {product.isSample && (
            <SampleNotice>
              <strong>Dato de muestra.</strong> Este producto es un ejemplo. La
              información oficial (imagen, características y disponibilidad) se
              cargará desde el catálogo de JC Security.
            </SampleNotice>
          )}
        </div>
      </div>

      {/* Productos relacionados (misma categoría) */}
      {related.length > 0 && (
        <section className="related-products">
          <div className="related-head">
            <h2>Productos relacionados</h2>
            <Link
              to={`/catalogo?categorias=${product.categorySlug}`}
              className="btn btn-ghost btn-sm"
            >
              Ver más de esta categoría
            </Link>
          </div>
          {/* Fila horizontal que se desliza a izquierda y derecha. */}
          <ProductCarousel groups={related} label="Productos relacionados" />
        </section>
      )}
    </section>
  );
}
