import { SampleNotice } from "@/components/ui/states";

export function ServicesPage() {
  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Experiencia</span>
        <h1>Servicios realizados</h1>
        <p>Instalaciones y servicios ejecutados por JC Security.</p>
      </div>

      <SampleNotice>
        <strong>Galería en preparación.</strong> Las fotos y descripciones de
        los servicios se agregarán cuando JC Security proporcione contenido
        real. No se inventa contenido.
      </SampleNotice>

      <div className="grid grid-cards projects-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card project-placeholder">
            <div className="project-ph-media" aria-hidden="true" />
            <div className="project-ph-body">
              <span className="chip">Próximamente</span>
              <p className="muted">Servicio pendiente de publicación.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
