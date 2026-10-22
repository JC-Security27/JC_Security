/* ==========================================================================
   Formato de texto para mostrar.
   Los nombres del catálogo Tolsen vienen en MAYÚSCULAS ("ALICATE UNIVERSAL").
   CSS text-transform: capitalize no sirve sobre mayúsculas (no baja el resto).
   Esta función pasa a tipo oración por palabra, pero preserva siglas/unidades
   como "20V", "LED", "PVC", "SDS", "1/2", etc. (no las convierte a minúsculas).
   ========================================================================== */

/** ¿La palabra parece una sigla o unidad que debe quedar tal cual? */
function isAcronymOrUnit(word: string): boolean {
  // Contiene algún dígito (20V, 1/2", M14, 650W) → dejar igual.
  if (/\d/.test(word)) return true;
  // Palabra corta toda en mayúsculas (LED, PVC, SDS, CR, V, A) → sigla.
  const letters = word.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, "");
  if (letters.length > 0 && letters.length <= 3 && letters === letters.toUpperCase()) {
    return true;
  }
  return false;
}

/** Convierte "ALICATE UNIVERSAL 20V" -> "Alicate Universal 20V". */
export function toDisplayName(raw: string): string {
  if (!raw) return raw;
  return raw
    .toLocaleLowerCase("es")
    .split(/\s+/)
    .map((wordLower, i) => {
      // Recupera la palabra original para comparar siglas.
      const original = raw.split(/\s+/)[i] ?? wordLower;
      if (isAcronymOrUnit(original)) return original;
      // Tipo oración: primera letra mayúscula, resto minúscula.
      return wordLower.charAt(0).toLocaleUpperCase("es") + wordLower.slice(1);
    })
    .join(" ");
}
