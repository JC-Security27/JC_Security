import { siteConfig } from "@/config/site";
import { SampleNotice } from "@/components/ui/states";

export function SocialPage() {
  return (
    <section className="section container">
      <div className="section-head">
        <span className="eyebrow">Comunidad</span>
        <h1>Redes sociales</h1>
        <p>Síguenos para novedades, promociones y consejos de seguridad.</p>
      </div>

      <SampleNotice>
        <strong>Pendiente.</strong> Las cuentas y enlaces oficiales de JC
        Security aún no se han proporcionado. Aquí se mostrarán cuando estén
        disponibles.
      </SampleNotice>

      <div className="grid grid-cards social-grid">
        {siteConfig.socials.map((s) => {
          const available = Boolean(s.url);
          return (
            <div key={s.id} className="card social-card">
              <span className="social-name">{s.label}</span>
              {available ? (
                <a
                  className="btn btn-outline btn-sm"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visitar
                </a>
              ) : (
                <span className="chip">Próximamente</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
