import { siteConfig } from "@/config/site";

/* Logo de JC Security.
   Escudo con "JC" dentro + la palabra "Security" a la derecha del escudo. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <svg
        className="logo-mark"
        viewBox="0 0 56 64"
        width="52"
        height="58"
        aria-hidden="true"
      >
        <path
          d="M28 3 L51 12 V31 C51 46 41 57 28 62 C15 57 5 46 5 31 V12 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <text
          x="28"
          y="40"
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontWeight="800"
          fontSize="22"
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
