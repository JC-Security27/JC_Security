import { PageHero } from "@/components/ui/RobotStage";
import { SampleNotice } from "@/components/ui/states";

const GUIDE_IMG = "https://xehegspjlbpkvhsgcdqj.supabase.co/storage/v1/object/public/catalogo/";

export function GuidesPage() {
  return (
    <section className="section container">
      <PageHero
        eyebrow="Recursos"
        title="Guías de seguridad"
        robot="guias"
        chips={[
          { label: "Seguridad en el hogar", img: `${GUIDE_IMG}ajax-bkeypadtouch-hq.webp` },
          { label: "Seguridad para negocios", img: `${GUIDE_IMG}zkteco-horustl2-hq.webp` },
          { label: "Mantenimiento de cámaras", img: `${GUIDE_IMG}dahua-ipchfw2449tzasil-hq.webp` },
          { label: "Detección de incendio", img: `${GUIDE_IMG}ajax-bfireprotect2rb-hq.webp` },
        ]}
      >
        <p>
          Consejos y guías prácticas para proteger tu hogar y tu negocio.
        </p>
      </PageHero>

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
