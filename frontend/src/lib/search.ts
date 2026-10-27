import { normalizeForSearch } from "@/lib/format";
import type { Product } from "@/types/catalog";

/* ==========================================================================
   Búsqueda del catálogo con sinónimos.
   El cliente puede buscar un artículo con otro nombre ("brida" -> "gaza",
   "bala" -> "bullet", "chapa" -> "cerradura"…). Cada grupo reúne palabras que
   significan lo mismo; si el término buscado está en un grupo, el producto
   coincide con cualquiera de ellas. Sin tildes, sin mayúsculas y tolerante a
   plurales. Para agregar sinónimos, sumar palabras a un grupo o un grupo nuevo.
   ========================================================================== */

const SYNONYMS: string[][] = [
  // Ferretería
  ["gaza", "brida", "cincho", "cintillo", "amarra", "amarre plastico", "zuncho", "tie wrap", "cable tie"],
  ["taco", "tarugo", "expander", "anclaje", "ancla"],
  ["tornillo", "perno", "pija"],
  ["destornillador", "desatornillador", "atornillador"],
  ["alicate", "pinza", "tenaza"],
  ["carraca", "ratchet", "rach", "matraca"],
  ["llave ajustable", "llave inglesa", "llave perico", "perico"],
  ["llave hexagonal", "llave allen", "allen"],
  ["cubo", "dado", "copa"],
  ["cuter", "cutter", "cuchilla", "navaja"],
  ["cinta metrica", "flexometro", "huincha"],
  ["serrucho", "sierra"],
  ["esmeriladora", "pulidora", "amoladora"],
  ["taladro", "rotomartillo", "barreno"],
  ["broca", "mecha", "barrena"],
  ["cautin", "soldador", "soldadura de estano"],
  ["silicon", "silicona"],
  ["pegamento", "goma", "super glue", "superglue", "adhesivo"],
  ["prensa", "sargento"],
  ["remachadora", "remachador", "pop"],
  ["mochila", "bulto", "salveque"],
  ["bolso", "maletin", "estuche", "porta herramientas"],
  ["llanta", "neumatico", "rueda"],
  ["manguera", "hose"],
  ["gafas", "lentes", "anteojos"],
  ["zapato", "bota", "calzado"],
  ["tenis", "zapatilla"],
  ["guante", "guantes"],
  ["casco", "hard hat"],
  ["chaleco", "vest"],
  ["capa", "poncho"],
  // Eléctrico e instalación
  ["regleta", "multitoma", "extension electrica", "zapatilla electrica"],
  ["tomacorriente", "toma", "enchufe", "contacto doble", "contacto sencillo"],
  ["apagador", "interruptor"],
  ["canaleta", "ducto"],
  ["tubo", "conduit", "emt"],
  ["fuente de poder", "fuente", "adaptador", "cargador", "transformador", "power supply"],
  ["ups", "no break", "nobreak", "respaldo"],
  ["regulador", "estabilizador"],
  ["bateria", "pila"],
  // Seguridad electrónica
  ["bullet", "bala"],
  ["domo", "dome"],
  ["eyeball", "torreta", "turret"],
  ["ptz", "speed dome", "robotica"],
  ["grabador", "dvr", "nvr", "xvr"],
  ["camara", "camaras", "cctv"],
  ["disco duro", "hdd"],
  ["memoria", "micro sd", "microsd", "tarjeta sd"],
  ["cerradura", "chapa", "llavin", "cerrojo"],
  ["electroiman", "cerradura magnetica"],
  ["videoportero", "intercomunicador", "timbre", "portero", "citofono"],
  ["alarma", "panel de alarma"],
  ["sirena", "bocina"],
  ["sensor", "detector"],
  ["control de acceso", "lector", "biometrico", "reloj marcador"],
  ["tarjeta de proximidad", "tarjeta rfid", "tag", "llavero"],
  ["switch", "conmutador", "suiche"],
  ["router", "enrutador", "ruteador"],
  ["access point", "punto de acceso", "repetidor", "extensor"],
  ["cable utp", "cable de red", "cable ethernet"],
  ["conector rj45", "plug", "rj45"],
  ["humo", "incendio", "fuego"],
];

// Palabras que no ayudan a buscar.
const STOPWORDS = new Set([
  "de", "del", "para", "con", "sin", "el", "la", "los", "las", "y", "o", "en",
  "un", "una", "unos", "unas", "por", "a", "al",
]);

const norm = (s: string) =>
  normalizeForSearch(s)
    .replace(/[^\p{L}\p{N}\s./"-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Sinónimos normalizados, de la frase más larga a la más corta. */
const PHRASES: { phrase: string; group: string[] }[] = SYNONYMS.flatMap(
  (group) => {
    const g = group.map(norm);
    return g.map((phrase) => ({ phrase, group: g }));
  }
).sort((a, b) => b.phrase.length - a.phrase.length);

/**
 * Formas sin plural ni género: "gazas" -> "gaza"; "negro"/"negras" -> "negr"
 * (así "cincho negro" encuentra "gaza plástica negra").
 */
function forms(word: string): string[] {
  const out = [word];
  if (word.length > 4 && word.endsWith("es")) out.push(word.slice(0, -2));
  if (word.length > 3 && word.endsWith("s")) out.push(word.slice(0, -1));
  const base = out[out.length - 1];
  if (base.length > 4 && /[ao]$/.test(base)) out.push(base.slice(0, -1));
  return out;
}

/**
 * Convierte la búsqueda en requisitos: cada requisito es un conjunto de
 * alternativas y el producto debe cumplir todos (cualquier alternativa vale).
 */
export function parseQuery(query: string): string[][] {
  let rest = ` ${norm(query)} `;
  const reqs: string[][] = [];
  // 1) Frases con sinónimos (ej. "cinta metrica", "no break").
  for (const { phrase, group } of PHRASES) {
    if (!phrase.includes(" ")) continue;
    if (rest.includes(` ${phrase} `)) {
      reqs.push(group);
      rest = rest.replace(` ${phrase} `, " ");
    }
  }
  // 2) Palabras sueltas.
  for (const word of rest.split(" ")) {
    if (!word || STOPWORDS.has(word)) continue;
    const alts = new Set<string>();
    // Si la palabra ya es un sinónimo conocido, no se le quita la "s"
    // ("lentes" son gafas; "lente" sería el de una cámara).
    const own = PHRASES.find((p) => p.phrase === word);
    for (const f of own ? [word] : forms(word)) {
      alts.add(f);
      const hit = PHRASES.find((p) => p.phrase === f);
      hit?.group.forEach((s) => alts.add(s));
    }
    reqs.push([...alts]);
  }
  return reqs;
}

const compact = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "");

/** ¿El producto coincide con la búsqueda? (nombre, referencia/código y marca) */
export function matchesSearch(p: Product, query: string): boolean {
  const reqs = parseQuery(query);
  if (reqs.length === 0) return true;
  const hay = ` ${norm([p.name, p.reference, p.brandName ?? ""].join(" "))} `;
  const hayCompact = compact(hay);
  return reqs.every((alts) =>
    alts.some(
      (a) =>
        // Al inicio de una palabra: "toma" no debe encontrar "automatico".
        hay.includes(` ${a}`) ||
        // Códigos con o sin guiones: "ipc-hfw2849" encuentra "IPCHFW2849…".
        (/\d/.test(a) && a.length >= 3 && hayCompact.includes(compact(a)))
    )
  );
}
