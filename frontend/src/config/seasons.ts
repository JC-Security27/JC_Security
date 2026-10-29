/* ==========================================================================
   Temporadas (pedido del usuario, 2026-10-29). En cada celebración la página
   cambia sola el Robot JC y los colores; fuera de ellas se ve la versión
   normal. Las fechas se comparan en hora de Costa Rica (UTC−6, sin horario
   de verano) y cada rango incluye el día de inicio y el de fin completos.

   - Robots: public/robots/<id>/robot-<seccion>.webp (home, catalogo,
     servicios, guias, contacto). Si una temporada no tiene robots, se usan
     los normales.
   - Colores: styles/seasons.css, con :root[data-season="<id>"].
   - Vista previa: agregar ?tema=<id> al enlace (o ?tema=normal).
   ========================================================================== */

export type SeasonId =
  | "independencia"
  | "cancer-mama"
  | "halloween"
  | "navidad"
  | "ano-nuevo";

interface Season {
  id: SeasonId;
  label: string;
  /** [mes, día] de inicio y de fin (1 = enero). Si el fin es antes que el
   *  inicio, el rango cruza el año (Año Nuevo). */
  start: [number, number];
  end: [number, number];
  robots: boolean;
}

export const SEASONS: Season[] = [
  { id: "independencia", label: "Independencia de Costa Rica", start: [9, 1], end: [9, 30], robots: true },
  { id: "cancer-mama", label: "Prevención del cáncer de mama", start: [10, 1], end: [10, 20], robots: true },
  { id: "halloween", label: "Halloween", start: [10, 21], end: [10, 31], robots: true },
  { id: "navidad", label: "Navidad", start: [11, 15], end: [12, 25], robots: true },
  { id: "ano-nuevo", label: "Año Nuevo", start: [12, 28], end: [1, 2], robots: false },
];

/** Prueba pedida por el usuario: fuerza una temporada en todo el sitio sin
 *  importar la fecha. `null` = automático según el calendario. */
const FORCED_SEASON: SeasonId | null = null;

function costaRicaMonthDay(now: Date): number {
  const cr = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  return (cr.getUTCMonth() + 1) * 100 + cr.getUTCDate();
}

function seasonForDate(now: Date): Season | null {
  const today = costaRicaMonthDay(now);
  return (
    SEASONS.find((s) => {
      const from = s.start[0] * 100 + s.start[1];
      const to = s.end[0] * 100 + s.end[1];
      return from <= to ? today >= from && today <= to : today >= from || today <= to;
    }) ?? null
  );
}

function resolveSeason(): Season | null {
  const param = new URLSearchParams(window.location.search).get("tema");
  if (param === "normal") return null;
  const byParam = SEASONS.find((s) => s.id === param);
  if (byParam) return byParam;
  if (FORCED_SEASON) return SEASONS.find((s) => s.id === FORCED_SEASON) ?? null;
  return seasonForDate(new Date());
}

/** Temporada activa, calculada una vez al abrir la página. */
export const activeSeason = resolveSeason();

if (activeSeason) document.documentElement.dataset.season = activeSeason.id;

/** Ruta del Robot JC de una sección, con la versión de temporada si existe. */
export function robotSrc(robot: string): string {
  const seasonal = ["home", "catalogo", "servicios", "guias", "contacto"];
  return activeSeason?.robots && seasonal.includes(robot)
    ? `/robots/${activeSeason.id}/robot-${robot}.webp`
    : `/robots/robot-${robot}.webp`;
}
