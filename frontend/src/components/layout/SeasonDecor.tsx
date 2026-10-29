import { useEffect, useState } from "react";
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

/* ----- Mes Patrio / Independencia (pedido del usuario, 2026-10-29) ----- */

/** Banderines azul, blanco y rojo colgados bajo la cinta tricolor. */
export function HeaderBunting() {
  if (activeSeason?.id !== "independencia") return null;
  const colors = ["#0047ab", "#f8f9fa", "#ce1126", "#f8f9fa"];
  return (
    <svg className="season-bunting" aria-hidden="true" focusable="false">
      {Array.from({ length: 40 }, (_, i) => (
        <g key={i} transform={`translate(${i * 120} 0)`}>
          <path d="M0 2 Q60 12 120 2" fill="none" stroke="rgba(248,249,250,0.55)" strokeWidth="1.2" />
          {[0, 1, 2, 3].map((j) => {
            const x = 6 + j * 28;
            const y = 2 + 10 * (1 - ((x + 11 - 60) / 60) ** 2) * 0.9;
            return (
              <path
                key={j}
                className={`bunting-flag f${j}`}
                d={`M${x} ${y} L${x + 22} ${y} L${x + 11} ${y + 20} Z`}
                fill={colors[j]}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** Rueda de carreta típica pintada (estilo Sarchí) asomando en las
 *  esquinas de arriba, como las telarañas de Halloween. */
export function CornerCartWheels() {
  if (activeSeason?.id !== "independencia") return null;
  const deg = (n: number, total: number) => (360 / total) * n;
  const wheel = (
    <svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      {/* Aro rojo con borde oscuro y puntos blancos */}
      <circle r="97" fill="#ce1126" stroke="#6e0a14" strokeWidth="3" />
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={`d${i}`} r="2.4" cy="-90" fill="#f8f9fa" transform={`rotate(${deg(i, 36)})`} />
      ))}
      {/* Banda amarilla con dientes azules */}
      <circle r="84" fill="#f5b700" />
      {Array.from({ length: 28 }, (_, i) => (
        <path key={`z${i}`} d="M-9 -84 L0 -71 L9 -84 Z" fill="#0047ab" transform={`rotate(${deg(i, 28)})`} />
      ))}
      {/* Fondo azul profundo con pétalos alternados */}
      <circle r="70" fill="#0a2540" stroke="#f8f9fa" strokeWidth="1.5" />
      {Array.from({ length: 16 }, (_, i) => (
        <g key={`p${i}`} transform={`rotate(${deg(i, 16)})`}>
          <path
            d="M0 -24 C-12 -36 -10 -56 0 -66 C10 -56 12 -36 0 -24 Z"
            fill={i % 2 ? "#f8f9fa" : "#ce1126"}
            stroke="#f5b700"
            strokeWidth="1.2"
          />
          <path d="M0 -32 C-4 -40 -4 -50 0 -56 C4 -50 4 -40 0 -32 Z" fill={i % 2 ? "#0047ab" : "#f5b700"} />
        </g>
      ))}
      {/* Centro: anillo amarillo, estrella roja y maza azul */}
      <circle r="25" fill="#f5b700" stroke="#6e0a14" strokeWidth="1.5" />
      <path
        d="M0 -21 L5 -8 L18 -11 L9 -1 L18 11 L5 8 L0 21 L-5 8 L-18 11 L-9 -1 L-18 -11 L-5 -8 Z"
        fill="#ce1126"
      />
      <circle r="8" fill="#0047ab" stroke="#f8f9fa" strokeWidth="2" />
      <circle r="3" fill="#f8f9fa" />
    </svg>
  );
  return (
    <div className="season-wheels" aria-hidden="true">
      <span className="season-wheel is-left">{wheel}</span>
      <span className="season-wheel is-right">{wheel}</span>
    </div>
  );
}

/* ----- Año Nuevo (pedido del usuario, 2026-10-29): gala en dorado, blanco y
   negro. Sin años escritos en ningún lado: todo se calcula con la fecha. ----- */

/** Fuegos artificiales geométricos (estallidos de chispas y estrellas de 4
 *  puntas) en las esquinas de arriba, como las telarañas de Halloween. */
export function CornerFireworks() {
  if (activeSeason?.id !== "ano-nuevo") return null;
  const burst = (r: number, rays: number, color: string, cls: string) => (
    <g className={`fw-burst ${cls}`}>
      {Array.from({ length: rays }, (_, i) => (
        <g key={i} transform={`rotate(${(360 / rays) * i})`}>
          <path d={`M0 ${-r * 0.35} L0 ${-r}`} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <circle cy={-r - 4} r="1.6" fill={color} />
        </g>
      ))}
    </g>
  );
  const star = (x: number, y: number, s: number, color: string, cls: string) => (
    <path
      className={`fw-star ${cls}`}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z"
      fill={color}
    />
  );
  const art = (
    <svg viewBox="0 0 220 160" aria-hidden="true" focusable="false">
      <g transform="translate(70 70)">{burst(46, 16, "#d4af37", "b1")}</g>
      <g transform="translate(160 40)">{burst(26, 12, "#e2e8f0", "b2")}</g>
      <g transform="translate(150 118)">{burst(18, 10, "#d4af37", "b3")}</g>
      {star(120, 80, 0.9, "#f8f9fa", "s1")}
      {star(30, 140, 0.6, "#d4af37", "s2")}
      {star(200, 90, 0.5, "#e2e8f0", "s3")}
    </svg>
  );
  return (
    <div className="season-fireworks" aria-hidden="true">
      <span className="season-fw is-left">{art}</span>
      <span className="season-fw is-right">{art}</span>
    </div>
  );
}

/** Medianoche del 1 de enero que viene, en hora de Costa Rica (UTC−6).
 *  El año sale siempre de la fecha actual: funciona todos los años sin
 *  tocar nada. (Se usa la fecha de Costa Rica en lugar de
 *  new Date().getFullYear() del navegador, para que un visitante en otro
 *  huso horario vea la misma medianoche que en Costa Rica.) */
function nextNewYearMidnight(now: Date): number {
  const crYear = new Date(now.getTime() - 6 * 3600_000).getUTCFullYear();
  return Date.UTC(crYear + 1, 0, 1, 6, 0, 0); // 00:00 en CR = 06:00 UTC
}

/** Texto de la cuenta regresiva, o null si ya pasó la medianoche (del 1 al
 *  2 de enero la temporada sigue activa y se muestra el saludo). */
function countdownText(now: Date): string | null {
  const crMonth = new Date(now.getTime() - 6 * 3600_000).getUTCMonth();
  if (crMonth === 0) return null; // ya es enero en Costa Rica
  const left = Math.max(0, nextNewYearMidnight(now) - now.getTime());
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor(left / 3_600_000) % 24;
  const m = Math.floor(left / 60_000) % 60;
  const sec = Math.floor(left / 1000) % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d > 0 ? `${d} d ` : ""}${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Reloj minimalista marcando las 12:00 con la cuenta regresiva para
 *  medianoche; después de medianoche dice "¡Feliz Año Nuevo!". */
export function NewYearCountdown() {
  const active = activeSeason?.id === "ano-nuevo";
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  if (!active) return null;
  const left = countdownText(now);
  return (
    <div className="ny-countdown" role="status" aria-live="off">
      <svg className="ny-clock" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle cx="20" cy="20" r="17" fill="none" stroke="#d4af37" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={i % 3 === 0 ? "M20 5 V9" : "M20 5 V7"}
            stroke="#e2e8f0"
            strokeWidth={i % 3 === 0 ? 2 : 1.2}
            strokeLinecap="round"
            transform={`rotate(${i * 30} 20 20)`}
          />
        ))}
        {/* Las dos agujas juntas en las 12 */}
        <path d="M20 20 V11" stroke="#f8f9fa" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 20 V8" stroke="#d4af37" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="20" cy="20" r="1.8" fill="#d4af37" />
      </svg>
      {left ? (
        <span>
          <span className="ny-label-long">Cuenta regresiva para medianoche</span>
          <span className="ny-label-short">Medianoche en</span> <strong>{left}</strong>
        </span>
      ) : (
        <span>
          <strong>¡Feliz Año Nuevo!</strong> Nuevas metas, nuevos comienzos
        </span>
      )}
    </div>
  );
}
