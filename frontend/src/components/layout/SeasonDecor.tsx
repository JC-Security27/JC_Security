import { activeSeason } from "@/config/seasons";

/* Guirnalda navideña bajo el menú (pedido del usuario, 2026-10-29): rama
   verde en SVG con luces que parpadean suave. Es solo decoración: no recibe
   clics (pointer-events: none en .season-garland) y no la leen los lectores
   de pantalla. Los estilos están en styles/seasons.css. */
export function HeaderGarland() {
  if (activeSeason?.id !== "navidad") return null;
  // 40 tramos de 120 px cubren pantallas de hasta 4800 px; lo que sobra se
  // recorta. (Un <pattern> no anima las luces en todos los navegadores.)
  return (
    <svg className="season-garland" aria-hidden="true" focusable="false">
      {Array.from({ length: 40 }, (_, i) => (
        <g key={i} transform={`translate(${i * 120} 0)`}>
          <path d="M0 4 Q30 20 60 4 Q90 20 120 4" fill="none" stroke="#1f7a4f" strokeWidth="4" strokeLinecap="round" />
          <path d="M0 4 Q30 20 60 4 Q90 20 120 4" fill="none" stroke="#13402f" strokeWidth="1.5" strokeDasharray="2 5" />
          <circle className="garland-bulb b1" cx="15" cy="14" r="3.4" fill="#e0303c" />
          <circle className="garland-bulb b2" cx="45" cy="14" r="3.4" fill="#f2c14e" />
          <circle className="garland-bulb b3" cx="75" cy="14" r="3.4" fill="#f5f8fa" />
          <circle className="garland-bulb b4" cx="105" cy="14" r="3.4" fill="#3ccf7f" />
        </g>
      ))}
    </svg>
  );
}

/* ----- Halloween (pedido del usuario, 2026-10-29) ----- */

/** Goteo de calabaza bajo el menú. */
export function HeaderDrip() {
  if (activeSeason?.id !== "halloween") return null;
  return (
    <svg className="season-drip" aria-hidden="true" focusable="false">
      {Array.from({ length: 30 }, (_, i) => (
        <path
          key={i}
          transform={`translate(${i * 160} 0)`}
          d="M0 0 H160 V4 C150 4 148 8 147 14 C146 20 140 20 139 14 C138 8 134 5 124 5 C112 5 110 9 109 22 C108 31 99 31 98 22 C97 11 94 5 82 5 C70 5 68 8 67 11 C66 15 61 15 60 11 C59 6 54 4 44 4 C34 4 31 8 30 17 C29 25 21 25 20 17 C19 9 14 4 0 4 Z"
          fill="url(#drip-fill)"
        />
      ))}
      <defs>
        <linearGradient id="drip-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7518" />
          <stop offset="1" stopColor="#d9550a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Telarañas en las esquinas de arriba de la pantalla. */
export function CornerWebs() {
  if (activeSeason?.id !== "halloween") return null;
  const web = (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M0 0 L120 6 M0 0 L108 52 M0 0 L80 92 M0 0 L44 116 M0 0 L6 120" />
        <path d="M24 1 Q20 10 22 10 Q16 16 19 19 Q12 20 9 22 Q8 24 1 24" />
        <path d="M50 3 Q42 18 45 21 Q34 32 39 39 Q24 42 20 45 Q16 48 2 50" />
        <path d="M78 4 Q66 26 70 32 Q54 48 60 56 Q38 62 32 68 Q26 72 4 76" />
        <path d="M104 5 Q90 36 94 44 Q74 64 80 74 Q52 84 44 92 Q36 98 5 102" />
      </g>
      <path d="M80 74 v18" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="80" cy="96" r="3.4" fill="currentColor" />
    </svg>
  );
  return (
    <div className="season-webs" aria-hidden="true">
      <span className="season-web is-left">{web}</span>
      <span className="season-web is-right">{web}</span>
    </div>
  );
}

/** Murciélagos que revolotean junto al Robot JC. */
export function StageBats() {
  if (activeSeason?.id !== "halloween") return null;
  return (
    <span className="stage-bats" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`stage-bat bat-${i}`} viewBox="0 0 64 32" focusable="false">
          <path
            d="M32 10 C30 6 28 5 27 7 C22 3 14 2 2 8 C8 10 10 14 9 18 C14 15 18 16 20 20 C23 16 27 16 29 19 L32 22 L35 19 C37 16 41 16 44 20 C46 16 50 15 55 18 C54 14 56 10 62 8 C50 2 42 3 37 7 C36 5 34 6 32 10 Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}
