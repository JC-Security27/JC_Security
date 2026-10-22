/* Propuesta de Claude para frontend/src/lib/format.ts (ver para-kiro.md).
   Probada contra los 322 nombres distintos del catálogo Tolsen. */

/** Siglas que aparecen en el catálogo y deben quedar en mayúsculas. */
const ACRONYMS = new Set([
  "AA", "AAA", "AC", "AH", "AWG", "CE", "DC", "EMT", "IP65", "LCD", "LED", "PVC", "SDS", "USB",
]);

/** Palabras que van en minúscula (salvo al inicio del nombre). */
const LOWERCASE = new Set(["a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o", "para", "por", "sin", "y"]);

/** Convierte "ALICATE DE PUNTA 20V" -> "Alicate de punta 20V" (tipo oración). */
export function toDisplayName(raw: string): string {
  if (!raw) return raw;
  return raw
    .split(/\s+/)
    .map((word, i) => {
      const core = word.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, ""); // sin "(", ")", ",", comillas
      if (/\d/.test(core) || ACRONYMS.has(core)) return word; // 20V, 1/2", LED, PVC…
      const lower = word.toLocaleLowerCase("es");
      if (i > 0 && LOWERCASE.has(core.toLocaleLowerCase("es"))) return lower;
      return i === 0 ? lower.replace(/\p{L}/u, (c) => c.toLocaleUpperCase("es")) : lower;
    })
    .join(" ");
}
