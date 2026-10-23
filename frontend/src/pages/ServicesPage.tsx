import { SampleNotice } from "@/components/ui/states";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { serviceInquiryMessage } from "@/lib/whatsapp";

/** Servicios reales confirmados por JC Security. */
const services = [
  {
    id: "planos-electricos",
    title: "Planos eléctricos",
    description:
      "Diseño y elaboración de planos eléctricos para hogares y negocios.",
  },
  {
    id: "cerca-electrica",
    title: "Instalación de cerca eléctrica",
    description:
      "Instalación de cercas eléctricas perimetrales para proteger tu " +
      "propiedad.",
  },
  {
    id: "camaras-seguridad",
    title: "Instalación de cámaras de seguridad",
    description:
      "Montaje y configuración de cámaras de seguridad para hogares y " +
      "negocios.",
  },
  {
    id: "trabajos-altura",
    title: "Trabajos de altura",
    description:
      "Trabajos en altura con el equipo y las medidas de seguridad " +
      "adecuadas.",
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

      <div className="services-grid">
        {services.map((s) => (
          <div key={s.id} className="card service-card">
            <div className="service-card-media" aria-hidden="true" />
            <div className="service-card-body">
              <span className="chip chip-accent service-card-tag">
                Servicio
              </span>
              <h3 className="service-card-title">{s.title}</h3>
              <p className="muted service-card-desc">{s.description}</p>
              <WhatsAppButton
                message={serviceInquiryMessage(s.title)}
                className="btn btn-whatsapp btn-sm btn-block service-card-cta"
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
