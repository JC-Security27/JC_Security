"""Usa fotos de otro PDF del catálogo (ya extraído) para tarjetas concretas.

Uso:
    python -I backend/catalog/use_pdf_images.py <salida_del_otro_pdf> backend/catalog/output tolsen-87280.webp ...

Cada nombre es el archivo de la foto en la extracción del otro PDF (mismo nombre
que en la del PDF original). Solo se pasan las fotos revisadas a mano: el PDF
"imágenes mejoradas" trae varias fotos de otro producto. La foto se copia como
images/<nombre>-pdf2.webp, sin el logo suelto de la esquina, y se asigna a todos
los productos que usaban esa tarjeta. No toca las tarjetas con foto oficial.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).resolve().parent))  # python -I no incluye la carpeta del script
from fetch_official_images import remove_corner_logo  # noqa: E402


def main(src_dir, out_dir, names):
    src, out = Path(src_dir), Path(out_dir)
    catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))
    for name in names:
        img = Image.open(src / "images" / name).convert("RGB")
        remove_corner_logo(img, zone_width=0.45)  # en estos recortes el logo ocupa más ancho
        box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
        if box:
            pad = round(max(img.size) * 0.04)
            img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0),
                            min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
        img.thumbnail((800, 800))
        target = f"images/{Path(name).stem}-pdf2.webp"
        img.save(out / target, "WEBP", quality=85, method=6)
        used = 0
        for p in catalog["products"]:
            pi = p["images"][0] if p["images"] else None
            if pi and not pi.get("officialImage") and Path(pi.get("pdfUrl") or pi["url"]).name == name:
                pi.setdefault("pdfUrl", pi["url"])
                pi.update({"url": target, "width": img.width, "height": img.height, "needsReview": False})
                used += 1
        print(f"{name} -> {target} ({img.width}x{img.height}), {used} productos")
    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
