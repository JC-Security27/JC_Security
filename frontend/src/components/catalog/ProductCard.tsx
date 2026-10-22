import { Link } from "react-router-dom";
import type { Product } from "@/types/catalog";
import { useQuote } from "@/context/QuoteContext";
import { toDisplayName } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { add, has } = useQuote();
  const img = product.images[0];
  const inList = has(product.id);

  return (
    <article className="product-card card">
      <Link
        to={`/producto/${product.id}`}
        className="product-card-media"
        aria-label={`Ver ${product.name}`}
      >
        {img ? (
          <img
            src={img.url}
            alt={img.alt}
            width={img.width}
            height={img.height}
            loading="lazy"
          />
        ) : (
          <div className="product-card-noimg">Sin imagen</div>
        )}
        {product.isNew && <span className="new-tag">Nuevo</span>}
        {product.isSample && <span className="sample-tag">Muestra</span>}
        {img?.needsReview && (
          <span className="sample-tag review" title="Imagen por revisar">
            Revisar
          </span>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-meta">
          {product.brandName && (
            <span className="chip chip-accent">{product.brandName}</span>
          )}
          <span className="product-ref">Ref: {product.reference}</span>
        </div>
        <h3 className="product-card-title">
          <Link to={`/producto/${product.id}`}>
            {toDisplayName(product.name)}
          </Link>
        </h3>
        {product.description && (
          <p className="product-card-desc">{product.description}</p>
        )}

        <div className="product-card-actions">
          <Link
            to={`/producto/${product.id}`}
            className="btn btn-outline btn-sm"
          >
            Ver detalle
          </Link>
          <button
            type="button"
            className={`btn btn-sm ${inList ? "btn-ghost" : "btn-primary"}`}
            onClick={() => add(product)}
            aria-pressed={inList}
          >
            {inList ? "Agregado ✓" : "Agregar a lista"}
          </button>
        </div>
      </div>
    </article>
  );
}
