"""Marca qué productos son el mismo artículo en distinta talla o medida.

Uso:
    python -I backend/catalog/assign_variants.py backend/catalog/output

Agrega a cada producto de catalog.json:
    variantGroupId  igual para todas las tallas de un mismo artículo (null si no tiene)
    sizeLabel       la talla o medida limpia, para mostrarla en el selector

Criterio (pedido de Kiro y el usuario: agrupar solo si cambia el tamaño):
- El PDF pone en una misma tarjeta las referencias de un artículo con su medida
  (10001 7", 10002 8"): esas son variantes.
- Dos tarjetas con el mismo nombre que llevan a la misma página de tolsentools.com
  (alicate de presión 10049 de 10" y 10380 de 7") también.
- Solo se agrupa si todas las referencias tienen medida y son distintas entre sí.
  Las que no traen medida (cascos o cintas de distintos colores) quedan sueltas.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path


def size_label(presentacion):
    label = presentacion.strip()
    if re.fullmatch(r"\(([^()]+)\)", label):  # "(XL)" -> "XL", "(39)" -> "39"
        label = label[1:-1].strip()
    return label


def main(out_dir):
    out = Path(out_dir)
    catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))
    official = json.loads((out / "official_images.json").read_text(encoding="utf-8"))
    page_of = {k: v.get("page") for k, v in official.items() if v.get("status") == "ok"}

    # 1) Agrupar por tarjeta del PDF (la foto original identifica la tarjeta).
    cards = defaultdict(list)
    for p in catalog["products"]:
        p["variantGroupId"] = None
        p["sizeLabel"] = None
        if p["images"]:
            cards[p["images"][0].get("pdfUrl") or p["images"][0]["url"]].append(p)

    # 2) Unir tarjetas con el mismo nombre y la misma página oficial.
    families = defaultdict(list)
    for card, products in cards.items():
        page = page_of.get(card)
        key = (products[0]["name"], products[0]["categorySlug"], page) if page else ("card", card)
        families[key].extend(products)

    groups = 0
    for key, products in families.items():
        visible = [p for p in products if not p["discontinued"]]
        sizes = [p["specs"].get("Presentación") for p in visible]
        names = {p["name"] for p in visible}
        if len(visible) < 2 or len(names) > 1 or not all(sizes) or len(set(sizes)) != len(sizes):
            continue
        refs = sorted(p["reference"] for p in visible)
        gid = "tolsen-" + refs[0].lower()
        for p in visible:
            p["variantGroupId"] = gid
            p["sizeLabel"] = size_label(p["specs"]["Presentación"])
        groups += 1

    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    grouped = [p for p in catalog["products"] if p["variantGroupId"]]
    print(f"{groups} grupos, {len(grouped)} productos con variantes")
    by = defaultdict(list)
    for p in grouped:
        by[p["variantGroupId"]].append(f"{p['reference']}={p['sizeLabel']}")
    for gid, items in sorted(by.items()):
        name = next(p["name"] for p in grouped if p["variantGroupId"] == gid)
        print(f"  {name}: {', '.join(items)}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "backend/catalog/output")
