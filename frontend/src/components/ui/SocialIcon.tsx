/* ==========================================================================
   Íconos de redes sociales (solo las que usa JC Security).
   Marcas registradas de sus respectivas empresas; se usan como enlace a los
   perfiles oficiales. SVG inline para que tomen el color del contenedor
   (currentColor) y escalen sin pérdida.
   ========================================================================== */

type IconProps = { size?: number };

function Facebook({ size = 24 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

function Instagram({ size = 24 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTok({ size = 24 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M16.5 3c.3 2.1 1.5 3.8 3.5 4.2v2.5c-1.3 0-2.5-.4-3.6-1.1v6.1c0 3.1-2.5 5.6-5.6 5.6S5.2 17.8 5.2 14.7s2.5-5.6 5.6-5.6c.3 0 .6 0 .9.1v2.6c-.3-.1-.6-.2-.9-.2-1.7 0-3 1.4-3 3.1s1.4 3.1 3 3.1 3.1-1.3 3.1-3.1V3h2.6Z" />
    </svg>
  );
}

const ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTok,
};

/** Devuelve el ícono de una red por su id (facebook/instagram/tiktok). */
export function SocialIcon({ id, size }: { id: string; size?: number }) {
  const Icon = ICONS[id];
  if (!Icon) return null;
  return <Icon size={size} />;
}
