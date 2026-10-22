import { siteConfig } from "@/config/site";

/* Logo tipográfico + escudo de JC Security.
   PENDIENTE: sustituir por el logotipo oficial cuando JC Security lo envíe. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label={siteConfig.name}>
      <svg
        className="logo-mark"
        viewBox="0 0 64 64"
        width="34"
        height="34"
        aria-hidden="true"
      >
        <path
          d="M32 6 L54 15 V32 C54 45 44 55 32 59 C20 55 10 45 10 32 V15 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="30" r="3.5" fill="var(--accent-strong)" />
        <circle cx="40" cy="30" r="3.5" fill="var(--accent-strong)" />
        <path
          d="M23 40 Q32 47 41 40"
          fill="none"
          stroke="var(--accent-strong)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="logo-text">
          <strong>JC</strong> Security
        </span>
      )}
    </span>
  );
}
