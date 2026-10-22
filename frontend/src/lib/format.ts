/* ==========================================================================
   Formato de texto para mostrar.
   Los nombres del catálogo Tolsen vienen en MAYÚSCULAS ("ALICATE DE PUNTA").
   CSS text-transform no sirve (capitalize no baja el resto; lowercase rompe
   siglas). Esta función pasa a tipo oración preservando siglas/unidades y
   dejando los conectores (de, y, con…) en minúscula.
   Versión validada por Claude contra los 322 nombres del catálogo
   (ver comunicacion/adjuntos/format.propuesta.ts).
   ========================================================================== */

/** Siglas que aparecen en el catálogo y deben quedar en mayúsculas. */
const ACRONYMS = new Set([
  "AA", "AAA", "AC", "AH", "AWG", "CE", "DC", "EMT", "IP65", "LCD", "LED",
  "PVC", "SDS", "USB",
]);

/** Palabras que van en minúscula (salvo al inicio del nombre). */
const LOWERCASE = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o",
  "para", "por", "sin", "y",
]);

/** Convierte "ALICATE DE PUNTA 20V" -> "Alicate de punta 20V" (tipo oración). */
export function toDisplayName(raw: string): string {
  if (!raw) return raw;
  return raw
    .split(/\s+/)
    .map((word, i) => {
      // Quita signos al inicio/fin para comparar: "(", ")", ",", comillas.
      const core = word.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, "");
      if (/\d/.test(core) || ACRONYMS.has(core)) return word; // 20V, 1/2", LED…
      const lower = word.toLocaleLowerCase("es");
      if (i > 0 && LOWERCASE.has(core.toLocaleLowerCase("es"))) return lower;
      return i === 0
        ? lower.replace(/\p{L}/u, (c) => c.toLocaleUpperCase("es"))
        : lower;
    })
    .join(" ");
}
