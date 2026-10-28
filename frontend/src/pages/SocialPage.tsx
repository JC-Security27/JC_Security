import { ICONS, PageHero } from "@/components/ui/RobotStage";
import { siteConfig } from "@/config/site";
import { SampleNotice } from "@/components/ui/states";
import { SocialIcon } from "@/components/ui/SocialIcon";

export function SocialPage() {
  return (
    <section className="section container">
      <PageHero
        eyebrow="Comunidad"
        title="Redes sociales"
        robot="redes"
        chips={[
          { label: "Facebook", icon: ICONS.facebook },
          { label: "Instagram", icon: ICONS.instagram },
          { label: "TikTok", icon: ICONS.tiktok },
          { label: "WhatsApp", icon: ICONS.whatsapp },
        ]}
      >
        <p>Síguenos para novedades, promociones y consejos de seguridad.</p>
      </PageHero>

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
              <span className="social-name">
                <span className={`social-icon social-icon-${s.id}`}>
                  <SocialIcon id={s.id} size={22} />
                </span>
                {s.label}
              </span>
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
