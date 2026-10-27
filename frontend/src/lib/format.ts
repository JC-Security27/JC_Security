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

/**
 * Normaliza texto para búsquedas: minúsculas y sin tildes.
 * "MEDICIÓN" y "medicion" se vuelven ambos "medicion".
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es");
}

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


/* ==========================================================================
   Limpieza de las características (specs) para mostrar al cliente.
   - "Código Intrade" -> "Código" (somos distribuidor autorizado; no exponemos
     el nombre del proveedor).
   - Se ocultan las claves de venta por caja/empaque mayorista, porque los
     productos se venden POR UNIDAD y esos datos confunden al cliente.
   ========================================================================== */

/** Renombres de claves de spec (clave original -> cómo se muestra). */
const SPEC_RENAME: Record<string, string> = {
  "Código Intrade": "Código",
  "Codigo Intrade": "Código",
};

/** Claves de spec que NO se muestran (venta por caja / empaque mayorista). */
const SPEC_HIDE = new Set([
  "cantidad por caja",
  "cantidad por empaque",
  "unidades por caja",
  "piezas por caja",
  "pares por caja",
  "cantidad de empaque",
  "empaque por caja",
]);

/**
 * Devuelve las entradas de specs listas para mostrar: renombra "Código
 * Intrade" a "Código" y omite las de cantidad por caja. Conserva el orden.
 */
export function displaySpecs(
  specs: Record<string, string> | undefined
): [string, string][] {
  if (!specs) return [];
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(specs)) {
    if (SPEC_HIDE.has(key.trim().toLowerCase())) continue;
    out.push([SPEC_RENAME[key] ?? key, value]);
  }
  return out;
}
