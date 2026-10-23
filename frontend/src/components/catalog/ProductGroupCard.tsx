import { Link } from "react-router-dom";
import { type ProductGroup, getVariantShortLabel } from "@/lib/variants";
import { toDisplayName } from "@/lib/format";
import { useQuote } from "@/context/QuoteContext";

/* Tarjeta de un grupo de variantes. Si el grupo tiene varias tallas, muestra
   una etiqueta "N tallas" y lleva al detalle del representante (donde se
   eligen las tallas). Si es un producto único, se comporta como tarjeta normal. */
export function ProductGroupCard({ group }: { group: ProductGroup }) {
  const { add, has } = useQuote();
  const product = group.representative;
  const img = product.images[0];
  const inList = has(product.id);

  return (
    <article className="product-card card">
      <Link
        to={`/producto/${product.id}`}
        className="product-card-media"
        aria-label={`Ver ${toDisplayName(product.name)}`}
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
        {group.hasVariants && (
          <span className="variants-tag">
            {group.variants.length} {getVariantShortLabel(group)}
          </span>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-meta">
          {product.brandName && (
            <span className="chip chip-accent">{product.brandName}</span>
          )}
          {!group.hasVariants && (
            <span className="product-ref">Ref: {product.reference}</span>
          )}
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
            {group.hasVariants ? "Ver opciones" : "Ver detalle"}
          </Link>
          {!group.hasVariants && (
            <button
              type="button"
              className={`btn btn-sm ${inList ? "btn-ghost" : "btn-primary"}`}
              onClick={() => add(product)}
              aria-pressed={inList}
            >
              {inList ? "Agregado ✓" : "Agregar a lista"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
