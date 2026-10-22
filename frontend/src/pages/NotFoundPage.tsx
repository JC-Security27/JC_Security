import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="section container">
      <div className="state state-empty" style={{ marginTop: "var(--space-8)" }}>
        <h1>Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
