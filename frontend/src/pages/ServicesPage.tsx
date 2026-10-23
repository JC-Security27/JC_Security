import { SampleNotice } from "@/components/ui/states";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { serviceInquiryMessage } from "@/lib/whatsapp";

/** Servicios reales confirmados por JC Security. */
const services = [
  {
    id: "planos-electricos",
    title: "Planos eléctricos",
    description:
      "Diseño y elaboración de planos eléctricos para hogares y negocios. " +
      "Consulta por WhatsApp para contarnos tu proyecto.",
  },
];

export function ServicesPage() {
  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Experiencia</span>
        <h1>Servicios</h1>
        <p>Servicios realizados por JC Security.</p>
      </div>

      <div className="grid grid-cards projects-grid">
        {services.map((s) => (
          <div key={s.id} className="card project-placeholder">
            <div className="project-ph-media" aria-hidden="true" />
            <div className="project-ph-body">
              <span className="chip chip-accent">Servicio</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.description}</p>
              <WhatsAppButton
                message={serviceInquiryMessage(s.title)}
                className="btn btn-whatsapp btn-sm"
              >
                Consultar por WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        ))}
      </div>

      <SampleNotice>
        <strong>Más servicios en camino.</strong> Iremos agregando fotos y
        descripciones de otros servicios cuando JC Security proporcione el
        contenido. No se inventa contenido.
      </SampleNotice>
    </section>
  );
}
