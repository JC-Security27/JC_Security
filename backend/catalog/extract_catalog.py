"""Extrae los productos del catálogo PDF de Tolsen a datos estructurados.

Uso:
    python -I backend/catalog/extract_catalog.py "Catálogo Tolsen_Ferre_actualizado.pdf" backend/catalog/output

Genera en la carpeta de salida:
    catalog.json   marcas, categorías y productos con la forma de frontend/src/types/catalog.ts
    images/*.webp  una imagen optimizada por tarjeta del catálogo
    review.md      todo lo que JC Security debe confirmar antes de publicar

Cómo lee el PDF: cada producto es una tarjeta blanca. Dentro de la tarjeta el
nombre va en Gibson-SemiBold, la referencia en Gibson-Regular y la presentación
(medida, piezas, talla) en Gibson-Light. El PDF tiene texto viejo en blanco
debajo del texto visible; solo se toma el texto en negro.
"""
import io
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops

BRAND = {"id": "tolsen", "name": "Tolsen"}
PARENT_CATEGORY = "herramientas"
IMAGE_MAX_SIDE = 800
# Lado menor de la foto original. Casi todas las fotos del PDF miden ~100 px;
# solo se marcan para revisión las que están muy por debajo.
MIN_SOURCE_PX = 75
# Escala al renderizar las fotos. 2 basta para el PDF original (~100 px); para un PDF
# con fotos de más resolución, súbela con la variable de entorno RENDER_ZOOM (ej. 5).
RENDER_ZOOM = float(os.environ.get("RENDER_ZOOM", "2"))

# Presentaciones que el PDF muestra pero que parecen copiadas de otra tarjeta.
# No se publican hasta que JC Security las confirme.
SUSPECT_VARIANTS = {
    "30021": "igual a la de 30010 (juego de cuchillas); no corresponde a unas tijeras",
    "87312": "igual a la de 20001 (desatornillador); no corresponde a una lámpara",
    "87231": "igual a la de 20001 (desatornillador); no corresponde a una multiherramienta",
    "10501": "igual a la de 42013 (tiralíneas)",
}

REF_RE = re.compile(r"(?<![\w.,x/])([A-Z]?\d{5}(?:-[A-Z0-9]+)?)/?(?![\w.,])")


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def clean(t):
    return re.sub(r"\s+", " ", t.replace("“", "”")).strip()


def inside(r, c, pad=2):
    return r.x0 >= c.x0 - pad and r.x1 <= c.x1 + pad and r.y0 >= c.y0 - pad and r.y1 <= c.y1 + pad


def page_spans(page):
    """Texto visible de la página y el título de la sección."""
    spans, seen, header = [], set(), None
    for b in page.get_text("dict")["blocks"]:
        if b["type"]:
            continue
        for line in b["lines"]:
            for s in line["spans"]:
                t = s["text"].strip()
                if not t:
                    continue
                r = pymupdf.Rect(s["bbox"])
                if r.y1 < 75 and s["size"] > 14:
                    header = clean(t)
                    continue
                if s["color"] != 0:
                    continue  # texto blanco = capa vieja oculta
                key = (t, round(r.x0), round(r.y0))
                if key in seen:
                    continue
                seen.add(key)
                spans.append((r, s["font"], t))
    return header, spans


def group_lines(spans):
    lines = []
    for r, t in sorted(spans, key=lambda x: (x[0].y0, x[0].x0)):
        if lines and abs(lines[-1][0] - r.y0) < 4:
            lines[-1][1].append((r.x0, t))
        else:
            lines.append([r.y0, [(r.x0, t)]])
    return [clean(" ".join(t for _, t in sorted(parts))) for _, parts in lines]


def parse_card(card, spans):
    """Devuelve (nombre, [(referencia, presentación)], specs extra, avisos)."""
    cs = [(r, f, t) for r, f, t in spans if inside(r, card)]
    names = sorted([(r, t) for r, f, t in cs if f.endswith("SemiBold")], key=lambda x: (round(x[0].y0), x[0].x0))
    name = clean(" ".join(t for _, t in names))
    name = re.sub(r"(\w)- (\w)", r"\1\2", name)  # guion de corte de línea
    name_top = min((r.y0 for r, _ in names), default=card.y1)

    refs, extra, notes = [], {}, []
    label = None  # "Cargadores compatibles:" -> las líneas siguientes son su valor
    last_line = []  # índices en refs de la última línea con referencias
    for text in group_lines([(r, t) for r, f, t in cs if not f.endswith("SemiBold")]):
        if label:
            extra[label] = clean(f"{extra.get(label, '')} {text}")
            continue
        toks = list(REF_RE.finditer(text))
        if toks and not text[: toks[0].start()].strip():
            last_line = []
            for k, m in enumerate(toks):
                end = toks[k + 1].start() if k + 1 < len(toks) else len(text)
                last_line.append(len(refs))
                refs.append([m.group(1), clean(text[m.end():end]) or None])
            if refs[-1][1] and refs[-1][1].endswith(":"):
                label, refs[-1][1] = refs[-1][1][:-1].strip().capitalize(), None
            continue
        # Línea sin referencia al inicio: es un dato del producto.
        key, colon, value = text.partition(":")
        parts = [clean(p) for p in text.split("/") if clean(p)]
        if colon and value.strip():
            extra[key.strip().capitalize()] = value.strip()
        elif colon:
            label = key.strip().capitalize()
        elif last_line and len(parts) == len(last_line) and all(refs[i][1] is None for i in last_line):
            # "54162/ 54163/ 54164" y debajo "4.2x16mm/ 4.2x19mm/ 4.2x25mm": van en orden.
            for i, p in zip(last_line, parts):
                refs[i][1] = p
        elif refs and refs[-1][1] and re.fullmatch(r"[^\d\s]+", text):
            refs[-1][1] = f"{refs[-1][1]} {text}"  # palabra cortada a la línea siguiente
        else:
            notes.append(f"línea sin referencia: `{text}`")
    return name, name_top, [tuple(r) for r in refs], extra, notes


def new_badge_bottom(page, card):
    """El sello "NUEVO" va en naranja en la esquina superior izquierda de la tarjeta.

    Devuelve la coordenada y donde termina el sello, o None si no hay sello.
    """
    strip = pymupdf.Rect(card.x0 - 12, card.y0 - 2, card.x0 + 75, card.y0 + 40)
    pix = page.get_pixmap(clip=strip, dpi=72, alpha=False)
    s, w = pix.samples, pix.width
    rows = [sum(1 for x in range(w) if (lambda i: s[i] > 200 and 90 < s[i + 1] < 170 and s[i + 2] < 90)((y * w + x) * 3))
            for y in range(pix.height)]
    top = rows[: round(22 * pix.height / strip.height)]
    if sum(top) / (len(top) * w) <= 0.05:
        return None
    last = max(y for y, n in enumerate(rows) if n > 2)
    return strip.y0 + (last + 2) * strip.height / pix.height


def render_image(page, card, imgs, name_top, out_path):
    """Recorta la foto del producto y la guarda como WebP.

    Devuelve (ancho, alto, es_nuevo, baja_calidad).
    """
    # Los marcos con sombra de las tarjetas también son imágenes: contienen la tarjeta completa.
    photos = [i for i in imgs if not i["rect"].contains(card)
              and (i["rect"] & card).get_area() > 0.4 * i["rect"].get_area()]
    if not photos:
        return None
    badge_bottom = new_badge_bottom(page, card)
    is_new = badge_bottom is not None
    photo = max(photos, key=lambda i: (i["rect"] & card).get_area())
    clip = photo["rect"] & card
    clip.y1 = min(clip.y1, name_top - 2)
    if is_new:  # no incluir el sello en la foto
        clip.y0 = max(clip.y0, badge_bottom)
    pix = page.get_pixmap(clip=clip, matrix=pymupdf.Matrix(RENDER_ZOOM, RENDER_ZOOM), alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    # Quitar el margen blanco alrededor del producto.
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.04)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0),
                        min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    img.thumbnail((IMAGE_MAX_SIDE, IMAGE_MAX_SIDE))
    img.save(out_path, "WEBP", quality=82, method=6)
    low_res = min(photo["px"]) < MIN_SOURCE_PX
    return img.width, img.height, is_new, low_res


def main(src, out_dir):
    out = Path(out_dir)
    (out / "images").mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(src)

    categories, products = {}, []
    review = {"sin_ref": [], "dudosas": [], "eol": [], "duplicadas": [], "baja_calidad": [], "otros": []}
    by_ref = {}

    for pno, page in enumerate(doc, 1):
        cards = [d["rect"] for d in page.get_drawings()
                 if d.get("fill") == (1.0, 1.0, 1.0) and d["rect"].width > 100 and d["rect"].height > 100]
        if not cards:
            continue
        header, spans = page_spans(page)
        slug = slugify(header)
        categories.setdefault(slug, {"id": slug, "slug": slug, "name": header,
                                     "parentSlug": PARENT_CATEGORY, "productCount": 0})
        imgs = [{"rect": pymupdf.Rect(i["bbox"]), "px": (i["width"], i["height"])} for i in page.get_image_info()]

        for ci, card in enumerate(sorted(cards, key=lambda r: (round(r.y0 / 50), r.x0))):
            name, name_top, refs, extra, notes = parse_card(card, spans)
            where = f"pág. {pno}"
            for n in notes:
                review["otros"].append(f"{where} — {name}: {n}")
            if not refs:
                review["sin_ref"].append(f"{where} — **{name}**: la tarjeta no tiene referencia legible")
                continue

            fname = f"tolsen-{refs[0][0].lower()}.webp"
            if (out / "images" / fname).exists():
                fname = f"tolsen-{refs[0][0].lower()}-p{pno}-{ci}.webp"
            rendered = render_image(page, card, imgs, name_top, out / "images" / fname)
            if rendered:
                w, h, is_new, low_res = rendered
                images = [{"url": f"images/{fname}", "alt": f"{name.capitalize()} Tolsen",
                           "width": w, "height": h, "needsReview": low_res}]
                if low_res:
                    review["baja_calidad"].append(f"{where} — {refs[0][0]} {name}")
            else:
                is_new, images = False, []
                review["otros"].append(f"{where} — {name}: no se encontró foto en la tarjeta")

            for ref, variant in refs:
                specs = dict(extra)
                discontinued = False
                if variant and re.search(r"\bEoL\b", variant):
                    discontinued = True
                    variant = clean(re.sub(r"\bEoL\b", "", variant)) or None
                    review["eol"].append(f"{where} — {ref} **{name}**")
                if variant and ref in SUSPECT_VARIANTS:
                    review["dudosas"].append(f"{where} — {ref} **{name}**: presentación «{variant}» "
                                             f"{SUSPECT_VARIANTS[ref]}. No se publica.")
                    variant = None
                if variant:
                    specs["Presentación"] = variant

                pid = f"tolsen-{ref.lower()}"
                prev = by_ref.get(ref)
                if prev:
                    if prev["name"] == name and prev["specs"] == specs:
                        review["duplicadas"].append(f"{where} — {ref} **{name}**: repetido igual que en "
                                                    f"pág. {prev['source']['page']}; se deja uno solo")
                        continue
                    pid = f"{pid}-p{pno}"
                    review["duplicadas"].append(
                        f"{where} — {ref} **{name}** ({specs.get('Presentación', 's/p')}) usa la misma referencia que "
                        f"pág. {prev['source']['page']} **{prev['name']}** ({prev['specs'].get('Presentación', 's/p')})")

                product = {
                    "id": pid,
                    "reference": ref,
                    "name": name,
                    "categorySlug": slug,
                    "brandId": BRAND["id"],
                    "brandName": BRAND["name"],
                    "images": images,
                    "specs": specs,
                    "isNew": is_new,
                    "discontinued": discontinued,
                    "source": {"page": pno, "card": ci},
                }
                by_ref.setdefault(ref, product)
                products.append(product)
                if not discontinued:
                    categories[slug]["productCount"] += 1

    catalog = {
        "source": Path(src).name,
        "brands": [BRAND],
        "categories": list(categories.values()),
        "products": products,
    }
    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    write_review(out / "review.md", catalog, review)
    print(f"{len(products)} productos, {len(categories)} categorías, "
          f"{len(list((out / 'images').glob('*.webp')))} imágenes")


def write_review(path, catalog, review):
    sections = [
        ("Tarjetas sin referencia (no se cargaron)", review["sin_ref"]),
        ("Presentaciones dudosas (se cargó el producto sin ese dato)", review["dudosas"]),
        ("Referencias repetidas", review["duplicadas"]),
        ("Productos marcados EoL en el PDF (descontinuados; no se publican)", review["eol"]),
        (f"Fotos de baja resolución en el PDF (menos de {MIN_SOURCE_PX} px; se marcan needsReview)",
         review["baja_calidad"]),
        ("Otros avisos", review["otros"]),
    ]
    lines = [
        "# Revisión del catálogo Tolsen",
        "",
        f"Fuente: `{catalog['source']}`. Productos extraídos: {len(catalog['products'])}.",
        "",
        "Estos puntos salen tal cual del PDF y necesitan confirmación de JC Security.",
        "",
        "**Sobre las fotos:** el PDF trae las fotos de producto a baja resolución (unos 100 px de lado).",
        "Se ven bien como miniatura, pero en el detalle del producto se notan borrosas. Lo ideal es",
        "pedir a Tolsen o a JC Security las fotos originales y reemplazarlas por referencia.",
        "",
    ]
    for title, items in sections:
        lines += [f"## {title}", ""] + ([f"- {i}" for i in items] or ["- Ninguno."]) + [""]
    path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
