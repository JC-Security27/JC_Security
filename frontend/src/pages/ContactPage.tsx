import { ICONS, PageHero } from "@/components/ui/RobotStage";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";

/* Contacto SIN formulario (según brief). WhatsApp es el canal principal.
   El resto de datos se muestran solo si JC Security los proporciona. */
export function ContactPage() {
  const { contact } = siteConfig;
  const rows = [
    { label: "Teléfono", value: contact.phone },
    { label: "Correo", value: contact.email },
    { label: "Dirección", value: contact.address },
    { label: "Horario", value: contact.hours },
  ];

  return (
    <section className="section container">
      <PageHero
        eyebrow="Hablemos"
        title="Contacto"
        robot="contacto"
        chips={[
          { label: "WhatsApp", icon: ICONS.whatsapp },
          { label: "Teléfono", icon: ICONS.phone },
          { label: "Correo", icon: ICONS.mail },
          { label: "Ubicación", icon: ICONS.pin },
        ]}
      >
        <p>
          La forma más rápida de consultarnos es por WhatsApp. Te respondemos
          con precio, disponibilidad y asesoría.
        </p>
      </PageHero>

      <div className="contact-layout">
        <div className="card contact-main">
          <h2>WhatsApp</h2>
          <p className="muted">
            Escríbenos con la referencia o el nombre del producto que buscas.
          </p>
          <WhatsAppButton
            message={generalContactMessage()}
            className="btn btn-whatsapp"
          >
            Abrir WhatsApp
          </WhatsAppButton>
        </div>

        <div className="card contact-details">
          <h2>Otros datos</h2>
          <dl className="specs-list">
            {rows.map((r) => (
              <div key={r.label} className="specs-row">
                <dt>{r.label}</dt>
                <dd>
                  {r.value ? (
                    r.value
                  ) : (
                    <span className="muted">Pendiente</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="muted" style={{ marginTop: "var(--space-3)" }}>
            Los datos marcados como “pendiente” se publicarán cuando JC Security
            los proporcione.
          </p>
        </div>
      </div>
    </section>
  );
}
