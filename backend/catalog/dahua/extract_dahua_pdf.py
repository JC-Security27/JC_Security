"""Extrae los productos del catálogo de Dahua Costa Rica (PDF).

Uso:
    python -I backend/catalog/dahua/extract_dahua_pdf.py "backend/catalog/nuevos/Catalogo_Dahua_v2-9.pdf"

Cada producto del PDF es una franja azul con el código (CenturyGothic-Bold), una
descripción en español (Calibri) que casi siempre termina con el modelo oficial, y
una foto incrustada al lado. La foto se extrae del PDF tal cual (con su máscara de
transparencia), no recortando la página.

Salida: pdf_products.json (código, modelo, descripción, sección, página) e
images_pdf/<clave>.png. build_dahua.py lo combina con las páginas oficiales.
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

HERE = Path(__file__).resolve().parent
BAND_BLUE = (0.05, 0.37, 0.67)

# Sección del PDF -> categoría del sitio. El sistema (analógico / IP) sale de las
# portadas de las páginas 2 y 14.
SECTION_CATEGORY = [
    (r"KITS", "kits-cctv"),
    (r"GRABADORES", "grabadores"),
    (r"DISCOS|MICRO SD", "almacenamiento"),
    (r"ACCESORIOS|TESTER", "accesorios-seguridad"),
    (r"M[ÓO]VIL", "solucion-movil"),
    (r"VIDEOPORTEROS", "videoporteros"),
    (r"CONTROL", "control-de-acceso"),
    (r"SWITCHES", "redes"),
    (r"MONITOREO", "monitores"),
    (r"SOLAR", "camaras-ip"),
    (r"C[ÁA]MARAS", None),  # depende del sistema
]


def key(code):
    """Clave para comparar modelos: sin prefijo DH/DHI, sin guiones ni espacios."""
    k = re.sub(r"[^a-z0-9]", "", code.lower())
    return re.sub(r"^dhi?(?=[a-z]{2,})", "", k) if not k.startswith("dhi-") else k[3:]


def is_model(token):
    return bool(re.fullmatch(r"[A-Z0-9][A-Z0-9/.\-]{4,}", token)) and re.search(r"\d", token) and re.search(r"[A-Z]", token)


def spans(page):
    for b in page.get_text("dict")["blocks"]:
        if b["type"]:
            continue
        for line in b["lines"]:
            for s in line["spans"]:
                if s["text"].strip():
                    yield pymupdf.Rect(s["bbox"]), s


def main(pdf):
    sys.stdout.reconfigure(encoding="utf-8")
    doc = pymupdf.open(pdf)
    out_img = HERE / "images_pdf"
    out_img.mkdir(exist_ok=True)
    products, system, section = [], "analogico", ""
    for pno, page in enumerate(doc, 1):
        page_spans = list(spans(page))
        heads = " ".join(s["text"].strip() for r, s in page_spans if s["size"] >= 20)
        if "ANAL" in heads:
            system = "analogico"
        elif re.search(r"\bIP\b", heads):
            system = "ip"
        if heads and "CATÁLOGO" not in heads:
            section = heads
        bands = [d["rect"] for d in page.get_drawings()
                 if d.get("fill") and all(abs(a - b) < 0.02 for a, b in zip(d["fill"], BAND_BLUE))
                 and d["rect"].height > 60 and 150 < d["rect"].width < 300]
        images = [i for i in page.get_image_info(xrefs=True)
                  if i["xref"] and 25 < pymupdf.Rect(i["bbox"]).width < 160 and pymupdf.Rect(i["bbox"]).height > 30]
        for band in bands:
            inside = sorted([(r, s) for r, s in page_spans if band.contains(pymupdf.Point((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))], key=lambda x: (round(x[0].y0), x[0].x0))
            codes = [s["text"].strip() for r, s in inside if 13 <= s["size"] < 20 and "Bold" in s["font"]]
            if not codes:
                continue
            desc = ""
            for r, s in inside:
                if s["size"] < 13:
                    t = s["text"].strip()
                    desc = desc + t if desc.endswith("-") else f"{desc} {t}".strip()
            tokens = desc.split()
            model = tokens[-1] if tokens and is_model(tokens[-1]) else None
            name = " ".join(tokens[:-1] if model else tokens)
            # La foto: la imagen incrustada que más se superpone con la franja (ampliada a los lados).
            zone = pymupdf.Rect(band.x0 - 40, band.y0 - 15, band.x1 + 40, band.y1 + 15)
            photo = max(images, key=lambda i: (pymupdf.Rect(i["bbox"]) & zone).get_area(), default=None)
            k = key(model or codes[0])
            img_file = None
            if photo and (pymupdf.Rect(photo["bbox"]) & zone).get_area() > 0:
                pix = pymupdf.Pixmap(doc, photo["xref"])
                smask = next((s for x, s, *_ in page.get_images(full=True) if x == photo["xref"]), 0)
                if smask:
                    pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, smask))
                if pix.colorspace and pix.colorspace.n > 3:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                img_file = f"images_pdf/{k}.png"
                pix.save(HERE / img_file)
            cat = next((c for pat, c in SECTION_CATEGORY if re.search(pat, section)), "otros-seguridad")
            if cat is None:
                cat = "camaras-hdcvi" if system == "analogico" else "camaras-ip"
            products.append({"code": codes[0], "model": model, "key": k, "name_es": name, "description_pdf": desc,
                             "section": section, "system": system, "category": cat, "page": pno,
                             "image": img_file, "image_px": [photo["width"], photo["height"]] if photo else None})
    (HERE / "pdf_products.json").write_text(json.dumps(products, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(products)} productos; con modelo: {sum(1 for p in products if p['model'])}; con foto: {sum(1 for p in products if p['image'])}")


if __name__ == "__main__":
    main(sys.argv[1])
