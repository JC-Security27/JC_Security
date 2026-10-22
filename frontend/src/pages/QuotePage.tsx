import { Link } from "react-router-dom";
import { useQuote } from "@/context/QuoteContext";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { quoteListMessage } from "@/lib/whatsapp";
import { EmptyState } from "@/components/ui/states";
import { hasWhatsApp } from "@/config/site";

export function QuotePage() {
  const { items, setQuantity, remove, clear, count } = useQuote();

  const message = quoteListMessage(
    items.map((i) => ({
      name: i.name,
      reference: i.reference,
      quantity: i.quantity,
    }))
  );

  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Lista de interés</span>
        <h1>Lista de cotización</h1>
        <p>
          Agrega los productos que te interesan y envía una sola consulta por
          WhatsApp con nombres, referencias y cantidades.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Tu lista está vacía">
          Explora el <Link to="/catalogo">catálogo</Link> y agrega productos a
          tu lista.
        </EmptyState>
      ) : (
        <div className="quote-layout">
          <ul className="quote-items">
            {items.map((item) => (
              <li key={item.productId} className="quote-item card">
                <div className="quote-item-info">
                  <Link to={`/producto/${item.productId}`}>
                    <strong>{item.name}</strong>
                  </Link>
                  <span className="muted">
                    Ref: {item.reference}
                    {item.brandName ? ` · ${item.brandName}` : ""}
                  </span>
                </div>
                <div className="quote-item-controls">
                  <label className="qty">
                    <span className="visually-hidden">Cantidad</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.productId, Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove(item.productId)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="quote-summary card">
            <h2>Resumen</h2>
            <p className="muted">
              {items.length} producto(s) · {count} unidad(es)
            </p>
            {!hasWhatsApp() && (
              <p className="notice" role="note">
                <span aria-hidden="true">⚠️</span>
                <span>
                  El número de WhatsApp aún no está configurado. El botón se
                  activará cuando JC Security lo proporcione.
                </span>
              </p>
            )}
            <WhatsAppButton message={message} className="btn btn-whatsapp btn-block">
              Enviar consulta por WhatsApp
            </WhatsAppButton>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={clear}
              style={{ marginTop: "var(--space-3)" }}
            >
              Vaciar lista
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
