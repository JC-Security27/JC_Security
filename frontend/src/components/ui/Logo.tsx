import { useState } from "react";
import { siteConfig } from "@/config/site";

/* Logo de JC Security.
   Usa la imagen oficial en /logo.png (colócala en frontend/public/logo.png).
   Si la imagen no está disponible, muestra un escudo SVG de respaldo con el
   mismo estilo: escudo con "JC" en cian y "Security" en texto. */
export function Logo({ compact = false }: { compact?: boolean }) {
  const [imgOk, setImgOk] = useState(true);

  if (imgOk) {
    return (
      <span className="logo" aria-label={siteConfig.name}>
        <img
          src="/logo.png"
          alt={siteConfig.name}
          className="logo-img"
          onError={() => setImgOk(false)}
        />
      </span>
    );
  }

  // Respaldo SVG (si aún no se ha subido logo.png).
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <svg
        className="logo-mark"
        viewBox="0 0 56 64"
        width="34"
        height="38"
        aria-hidden="true"
      >
        <path
          d="M28 4 L50 13 V30 C50 45 40 56 28 61 C16 56 6 45 6 30 V13 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <text
          x="28"
          y="39"
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontWeight="800"
          fontSize="22"
          fill="var(--accent-strong)"
        >
          JC
        </text>
      </svg>
      {!compact && (
        <span className="logo-text">
          <strong>JC</strong> Security
        </span>
      )}
    </span>
  );
}
