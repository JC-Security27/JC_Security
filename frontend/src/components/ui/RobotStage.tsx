import type { ReactNode } from "react";
import { robotSrc } from "@/config/seasons";

/* ==========================================================================
   Robot JC con su anillo y tarjetas flotantes (pedido del usuario,
   2026-10-28). Cada sección usa su propia versión del robot
   (public/robots/robot-<seccion>.webp) y muestra alrededor 4 imágenes o
   íconos de esa sección con su nombre.
   ========================================================================== */

export type RobotName = "home" | "catalogo" | "servicios" | "guias" | "redes" | "contacto";

export interface StageChip {
  label: string;
  /** Foto (producto, servicio…). */
  img?: string;
  /** Ícono (redes, contacto…) si no hay foto. */
  icon?: ReactNode;
  /** true: la foto llena el cuadro (fotos de servicios). Por defecto se ve
   *  completa sobre blanco (fotos de productos). */
  cover?: boolean;
}

export function RobotStage({
  robot,
  chips,
  className = "",
}: {
  robot: RobotName;
  chips: StageChip[];
  className?: string;
}) {
  return (
    <div className={`robot-stage ${className}`} aria-hidden="true">
      <span className="robot-stage-ring" />
      <img
        src={robotSrc(robot)}
        alt=""
        className="robot-stage-robot"
        width={656}
        height={1178}
        decoding="async"
      />
      {chips.slice(0, 4).map((c, i) => (
        <span key={c.label} className={`robot-chip robot-chip-${i}`}>
          <span className={`robot-chip-media ${c.cover ? "is-cover" : ""}`}>
            {c.img ? <img src={c.img} alt="" loading="lazy" /> : c.icon}
          </span>
          <span className="robot-chip-label">{c.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Encabezado de página: texto a la izquierda, Robot JC a la derecha. */
export function PageHero({
  eyebrow,
  title,
  children,
  robot,
  chips,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  robot: RobotName;
  chips: StageChip[];
}) {
  return (
    <div className="page-hero">
      <div className="page-hero-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </div>
      <RobotStage robot={robot} chips={chips} />
    </div>
  );
}

/* Íconos para las tarjetas de redes y contacto. */
const ic = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);
export const ICONS = {
  whatsapp: ic(
    <>
      <path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.2z" />
      <path d="M9 9.5c0 2.5 2.5 5 5 5l1.2-1.2 1.8.8v1.6c-4.6.4-8.6-3.6-8.2-8.2H10.4l.8 1.8z" />
    </>
  ),
  phone: ic(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />),
  mail: ic(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  pin: ic(
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  facebook: ic(<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" />),
  instagram: ic(
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  tiktok: ic(<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.8 2.5 4.5 5 4.6" />),
  shield: ic(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />),
};
