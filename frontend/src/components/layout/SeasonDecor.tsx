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
