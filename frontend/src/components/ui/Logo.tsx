import { siteConfig } from "@/config/site";

/* Logo de JC Security: escudo relleno con "JC" en cian + "Security" al lado. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <svg
        className="logo-mark"
        viewBox="0 0 64 72"
        width="46"
        height="52"
        aria-hidden="true"
      >
        {/* Escudo relleno con borde redondeado */}
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
        <text
          x="32"
          y="43"
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontWeight="800"
          fontSize="24"
          letterSpacing="-0.5"
          fill="var(--accent-strong)"
        >
          JC
        </text>
      </svg>
      {!compact && <span className="logo-text">Security</span>}
    </span>
  );
}
