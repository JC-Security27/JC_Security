import { memo } from "react";
import {
  CR_CAPITAL,
  CR_LIGHTS,
  CR_PATHS,
  CR_ROUTES,
  CR_VIEWBOX,
} from "@/components/home/costaRicaMap";

/**
 * Costa Rica de noche, como se ve desde un avión: contorno real del país con
 * brillo cian, luces cálidas agrupadas en las ciudades (más intensas en la
 * GAM), rutas de "red" entre ciudades y un pulso en San José.
 *
 * Rendimiento: va en DOS capas.
 * - `.cr-static`: tierra, contorno y las 570 luces, con filtros de brillo.
 *   No tiene nada animado, así el navegador lo dibuja una sola vez y al hacer
 *   scroll solo lo desplaza (capa compuesta por la GPU).
 * - `.cr-anim`: lo que se mueve (rutas, pulso y ~40 luces que titilan), sin
 *   filtros, para que redibujarlo cueste poco. Se pausa fuera de pantalla.
 * Decorativo (aria-hidden): no transmite información.
 */

// Luces que titilan: una de cada 14 de las chicas (se dibujan en la capa animada).
const TWINKLE = CR_LIGHTS.filter(([, , , , t], i) => t !== 0 && i % 14 === 0);
const [CX, CY] = CR_CAPITAL;

// Arco suave entre dos ciudades (curva hacia arriba según la distancia).
const arc = ([x1, y1, x2, y2]: [number, number, number, number]) => {
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.22;
  return `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - lift} ${x2} ${y2}`;
};

const StaticLayer = memo(function StaticLayer() {
  return (
    <svg className="cr-layer cr-static" viewBox={CR_VIEWBOX} focusable="false">
      <defs>
        <radialGradient id="cr-land" cx="50%" cy="45%" r="65%">
          <stop offset="0" stopColor="#123a52" stopOpacity="0.95" />
          <stop offset="1" stopColor="#0a2236" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id="cr-glow-warm">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.35" stopColor="#ffc861" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff8a2b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cr-halo">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <filter id="cr-outline-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cr-light-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="cr-clip">
          {CR_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>

      {/* Tierra y contorno con brillo */}
      <g filter="url(#cr-outline-glow)">
        {CR_PATHS.map((d, i) => (
          <path key={i} d={d} className="cr-land" fill="url(#cr-land)" />
        ))}
      </g>

      {/* Resplandor general de la GAM (dentro del país) */}
      <g clipPath="url(#cr-clip)">
        <circle cx={CX} cy={CY} r="150" fill="url(#cr-halo)" />
      </g>

      {/* Luces: alrededores y rurales como puntos; ciudades con halo */}
      <g filter="url(#cr-light-glow)">
        {CR_LIGHTS.map(([x, y, r, o, t], i) =>
          t === 0 ? (
            <g key={i}>
              <circle cx={x} cy={y} r={r * 3.2} fill="url(#cr-halo)" />
              <circle cx={x} cy={y} r={r * 0.9} fill="url(#cr-glow-warm)" />
            </g>
          ) : (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r * 1.25}
              opacity={o}
              fill={t === 1 ? "#ffd27a" : "#ffe7b0"}
            />
          )
        )}
      </g>

      <text x="70" y="880" className="cr-sea">Océano Pacífico</text>
      <text x="770" y="215" className="cr-sea">Mar Caribe</text>
    </svg>
  );
});

const AnimatedLayer = memo(function AnimatedLayer() {
  return (
    <svg className="cr-layer cr-anim" viewBox={CR_VIEWBOX} focusable="false">
      <defs>
        <radialGradient id="cr-twinkle-fill">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffd27a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Rutas de red entre ciudades (flujo animado) */}
      <g className="cr-routes">
        {CR_ROUTES.map((r, i) => (
          <path key={i} d={arc(r)} style={{ animationDelay: `${i * -0.7}s` }} />
        ))}
      </g>

      {/* Luces que titilan (sin filtro: el degradado ya hace el brillo) */}
      {TWINKLE.map(([x, y, r], i) => (
        <circle
          key={i}
          className="cr-twinkle"
          cx={x}
          cy={y}
          r={r * 3}
          fill="url(#cr-twinkle-fill)"
          style={{ animationDelay: `${(i * 0.53) % 3.2}s` }}
        />
      ))}

      {/* Pulso en San José */}
      <circle className="cr-pulse" cx={CX} cy={CY} r="10" />
      <circle className="cr-pulse cr-pulse--late" cx={CX} cy={CY} r="10" />
    </svg>
  );
});

export function CostaRicaNight() {
  return (
    <div className="cr-night" aria-hidden="true">
      <StaticLayer />
      <AnimatedLayer />
    </div>
  );
}
