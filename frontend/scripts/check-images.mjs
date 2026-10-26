#!/usr/bin/env node
/* ==========================================================================
   Verificador de imágenes — JC Security
   -------------------------------------------------------------------------
   Revisa las imágenes locales de frontend/public y avisa si alguna puede
   verse mal en la web:
     - archivo vacío o ilegible
     - no es una imagen (png/jpg/jpeg/webp/gif/svg)
     - dimensiones demasiado pequeñas (se verá borrosa al ampliar)
     - proporción muy extrema (muy alargada: se verá con mucho espacio vacío)
     - peso excesivo (carga lenta en celular)

   No usa dependencias externas: lee los encabezados de PNG/JPEG/WEBP/GIF para
   sacar el ancho y alto. Pensado para correr en un hook al agregar/guardar
   imágenes, y también a mano:  node scripts/check-images.mjs

   Salida: imprime advertencias y termina con código 0 (no bloquea). Para que
   bloquee en CI, pasá --strict y devolverá código 1 si hay problemas.
   ========================================================================== */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "public"
);

// Umbrales (ajustables). Pensados para fotos de producto y logos.
const MIN_SIDE = 200; // px: por debajo se ve borroso al ampliar en el detalle
const MAX_RATIO = 4; // relación lado largo / lado corto
const MAX_BYTES = 1_500_000; // 1.5 MB: por encima carga lento en celular
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

const strict = process.argv.includes("--strict");

/** Devuelve {width,height} leyendo los bytes de la imagen, o null si no puede. */
function readSize(buf, ext) {
  try {
    if (ext === ".png") {
      // IHDR: ancho/alto en big-endian en los offsets 16 y 20.
      if (buf.length < 24) return null;
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (ext === ".gif") {
      if (buf.length < 10) return null;
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      // Recorremos los segmentos hasta el marcador SOF (start of frame).
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) {
          off++;
          continue;
        }
        const marker = buf[off + 1];
        const len = buf.readUInt16BE(off + 2);
        // SOF0..SOF15 (menos DHT/DAC/RST) llevan alto/ancho.
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return {
            height: buf.readUInt16BE(off + 5),
            width: buf.readUInt16BE(off + 7),
          };
        }
        off += 2 + len;
      }
      return null;
    }
    if (ext === ".webp") {
      // RIFF....WEBP; soporta los formatos VP8 (lossy), VP8L (lossless), VP8X.
      if (buf.length < 30) return null;
      const fourcc = buf.toString("ascii", 12, 16);
      if (fourcc === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (fourcc === "VP8L") {
        const b = buf.subarray(21, 25);
        const bits = b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
      if (fourcc === "VP8X") {
        return {
          width: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1,
          height: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function listImages(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listImages(full));
    } else if (IMAGE_EXTS.has(extname(name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

/** Revisa un archivo y devuelve una lista de problemas (strings). */
function checkFile(file) {
  const ext = extname(file).toLowerCase();
  const name = basename(file);
  const problems = [];

  const st = statSync(file);
  if (st.size === 0) {
    problems.push("archivo vacío");
    return problems;
  }
  if (st.size > MAX_BYTES) {
    problems.push(
      `pesa ${(st.size / 1024 / 1024).toFixed(2)} MB (> ${(MAX_BYTES / 1024 / 1024).toFixed(1)} MB): puede cargar lento en celular`
    );
  }

  // Los SVG son vectoriales: no tienen dimensiones fijas que validar.
  if (ext === ".svg") return problems;

  const buf = readFileSync(file);
  const size = readSize(buf, ext);
  if (!size) {
    problems.push("no se pudo leer el tamaño (¿archivo corrupto o no es imagen?)");
    return problems;
  }

  const { width, height } = size;
  if (width < MIN_SIDE || height < MIN_SIDE) {
    problems.push(
      `muy pequeña (${width}x${height}px): se verá borrosa al ampliarla`
    );
  }
  const ratio = Math.max(width, height) / Math.min(width, height);
  if (ratio > MAX_RATIO) {
    problems.push(
      `proporción muy alargada (${width}x${height}, ${ratio.toFixed(1)}:1): dejará mucho espacio vacío en la tarjeta`
    );
  }
  return problems;
}

function main() {
  let files;
  try {
    files = listImages(PUBLIC_DIR);
  } catch (e) {
    console.error(`No se pudo leer ${PUBLIC_DIR}: ${e.message}`);
    process.exit(0); // no bloquear por un problema de entorno
  }

  let withProblems = 0;
  for (const file of files) {
    const problems = checkFile(file);
    if (problems.length) {
      withProblems++;
      console.warn(`⚠️  ${basename(file)}`);
      for (const p of problems) console.warn(`     - ${p}`);
    }
  }

  const ok = files.length - withProblems;
  console.log(
    `\nImágenes revisadas: ${files.length} · OK: ${ok} · con avisos: ${withProblems}`
  );

  if (withProblems && strict) {
    console.error("\nHay imágenes con problemas (modo --strict).");
    process.exit(1);
  }
  process.exit(0);
}

main();
