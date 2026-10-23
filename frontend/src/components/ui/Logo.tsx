import { siteConfig } from "@/config/site";

/* Logo de JC Security: escudo metálico (borde plateado con brillo, relleno
   azul con reflejo) y el monograma "JC" en cian dentro + "Security" al lado. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <span className="logo-shield" aria-hidden="true">
        <svg
          className="logo-shield-bg"
          viewBox="0 0 64 72"
          width="100%"
          height="100%"
        >
          <defs>
            {/* Borde plateado metálico (plata clara -> gris -> plata) */}
            <linearGradient id="jc-silver" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.25" stopColor="#dfe8ee" />
              <stop offset="0.5" stopColor="#9fb0bd" />
              <stop offset="0.75" stopColor="#c7d3dc" />
              <stop offset="1" stopColor="#7d8d9a" />
            </linearGradient>
            {/* Relleno del escudo: azul con un reflejo superior */}
            <linearGradient id="jc-fill" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#1e3c6e" />
              <stop offset="0.45" stopColor="#142b55" />
              <stop offset="1" stopColor="#0c1c3a" />
            </linearGradient>
            {/* Brillo diagonal sutil */}
            <linearGradient id="jc-gloss" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Borde metálico (escudo un poco más grande, hace de marco) */}
          <path
            d="M32 2 L58 12 V36 C58 52 47 63 32 70 C17 63 6 52 6 36 V12 Z"
            fill="url(#jc-silver)"
          />
          {/* Relleno interior */}
          <path
            d="M32 7 L53.5 15.2 V36 C53.5 49.5 44 59 32 65 C20 59 10.5 49.5 10.5 36 V15.2 Z"
            fill="url(#jc-fill)"
          />
          {/* Reflejo de luz */}
          <path
            d="M32 7 L53.5 15.2 V30 C44 24 20 24 10.5 30 V15.2 Z"
            fill="url(#jc-gloss)"
          />
        </svg>
        {/* Monograma JC (imagen recoloreada a cian con máscara) */}
        <span className="logo-jc" />
      </span>
      {!compact && <span className="logo-text">Security</span>}
    </span>
  );
}
