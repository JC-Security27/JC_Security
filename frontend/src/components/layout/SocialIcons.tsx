import { siteConfig } from "@/config/site";

/* Siluetas de Instagram y Facebook en el menú, después de "Contacto"
   (pedido del usuario, 2026-10-29). Mismo color que los enlaces del menú.
   Mientras JC Security no pase las direcciones de sus cuentas
   (siteConfig.socials[].url vacío), se muestran sin enlace y con el aviso
   "próximamente". */

const PATHS: Record<string, JSX.Element> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path
      d="M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.9v3h2.6V21"
      fill="currentColor"
      stroke="none"
    />
  ),
};

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <span className={`social-icons ${className}`}>
      {siteConfig.socials.map((s) => {
        const icon = (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {PATHS[s.id]}
          </svg>
        );
        return s.url ? (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            aria-label={s.label}
            title={s.label}
          >
            {icon}
          </a>
        ) : (
          <span
            key={s.id}
            className="social-icon is-pending"
            role="img"
            aria-label={`${s.label} (próximamente)`}
            title={`${s.label} — próximamente`}
          >
            {icon}
          </span>
        );
      })}
    </span>
  );
}
