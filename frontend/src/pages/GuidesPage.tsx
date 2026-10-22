import { SampleNotice } from "@/components/ui/states";

export function GuidesPage() {
  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Recursos</span>
        <h1>Guías de seguridad</h1>
        <p>
          Consejos y guías prácticas para proteger tu hogar y tu negocio.
        </p>
      </div>

      <SampleNotice>
        <strong>Sección en preparación.</strong> El contenido de las guías se
        agregará cuando JC Security lo proporcione o apruebe. No se muestra
        contenido de muestra como si fuera oficial.
      </SampleNotice>

      <div className="placeholder-list">
        {["Seguridad en el hogar", "Seguridad para negocios", "Mantenimiento de cámaras"].map(
          (title) => (
            <article key={title} className="card placeholder-item">
              <h3>{title}</h3>
              <p className="muted">Contenido pendiente de publicación.</p>
              <span className="chip">Próximamente</span>
            </article>
          )
        )}
      </div>
    </section>
  );
}
