import { siteConfig } from "@/config/site";

/* Logo de JC Security: escudo con el monograma "JC" (JC_logo) dentro + la
   palabra "Security" al lado. El "JC" usa la imagen jc-logo.png recoloreada a
   cian mediante una máscara CSS, para que mantenga el diseño oficial y resalte
   sobre el escudo oscuro. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <span className="logo-shield" aria-hidden="true">
        {/* Escudo */}
        <svg className="logo-shield-bg" viewBox="0 0 64 72" width="100%" height="100%">
          <path
            d="M32 3
               C 32 3, 50 11, 57 13
               C 58.5 13.5, 59 14.5, 59 16
               V 36
               C 59 52, 47 63, 32 69
               C 17 63, 5 52, 5 36
               V 16
               C 5 14.5, 5.5 13.5, 7 13
               C 14 11, 32 3, 32 3 Z"
            fill="var(--shield-fill)"
            stroke="var(--shield-stroke)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
        {/* Monograma JC (imagen recoloreada a cian con máscara) */}
        <span className="logo-jc" />
      </span>
      {!compact && <span className="logo-text">Security</span>}
    </span>
  );
}
