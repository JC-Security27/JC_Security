import { SampleNotice } from "@/components/ui/states";

export function ProjectsPage() {
  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Experiencia</span>
        <h1>Proyectos realizados</h1>
        <p>Instalaciones y proyectos ejecutados por JC Security.</p>
      </div>

      <SampleNotice>
        <strong>Galería en preparación.</strong> Las fotos y descripciones de
        proyectos se agregarán cuando JC Security proporcione contenido real. No
        se inventan proyectos.
      </SampleNotice>

      <div className="grid grid-cards projects-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card project-placeholder">
            <div className="project-ph-media" aria-hidden="true" />
            <div className="project-ph-body">
              <span className="chip">Próximamente</span>
              <p className="muted">Proyecto pendiente de publicación.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
