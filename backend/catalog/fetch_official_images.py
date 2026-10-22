"""Reemplaza las fotos del PDF por las fotos oficiales de tolsentools.com.

Uso:
    python -I backend/catalog/fetch_official_images.py backend/catalog/output

Para cada tarjeta del catálogo (las variantes comparten foto) busca sus
referencias en el buscador de tolsentools.com. Solo acepta una página si la
referencia aparece en la tabla "STOCK NO." o en el SKU del producto principal
(no en "Related products"). Descarga la foto principal, la recorta, la deja en
fondo blanco y la guarda como images/<nombre>-hd.webp.

Actualiza catalog.json (url, tamaño, needsReview = false, officialImage) y
escribe official_images.json con el origen de cada foto. Las tarjetas sin
coincidencia conservan la foto del PDF. Las páginas descargadas se guardan en
.cache/ para no repetir peticiones. JC Security es distribuidor y puede usar
estas fotos (confirmado por el usuario el 2026-10-22).
"""
import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops

SITE = "https://www.tolsentools.com"
UA = "Mozilla/5.0 (JC Security catalog sync)"
DELAY_S = 0.8
IMAGE_MAX_SIDE = 800
MAX_CANDIDATES = 4  # páginas de resultados a revisar cuando la búsqueda no redirige


def fetch(url, cache_dir, binary=False):
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", url.removeprefix(SITE))[:180] or "root"
    path = cache_dir / (name + (".bin" if binary else ".html"))
    meta = path.with_suffix(path.suffix + ".url")
    if path.exists():
        return (path.read_bytes() if binary else path.read_text(encoding="utf-8")), meta.read_text()
    time.sleep(DELAY_S)
    # Algunas URLs de la web traen caracteres como "°": hay que codificarlas.
    req = urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%#+,;@"), headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data, final = resp.read(), resp.geturl()
    path.write_bytes(data) if binary else path.write_text(data.decode("utf-8", "replace"), encoding="utf-8")
    meta.write_text(final)
    return (data if binary else data.decode("utf-8", "replace")), final


def main_product_text(page):
    """Texto visible del producto principal (sin productos relacionados)."""
    body = re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S)
    text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)))
    return text.split("Related products")[0]


def page_matches(page, ref):
    text = main_product_text(page)
    return bool(re.search(rf"(?<![\w-]){re.escape(ref)}(?![\w-])", text)) and (
        "STOCK NO" in text or "SKU" in text)


def main_image_url(page):
    for m in re.finditer(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        for node in data.get("@graph", [data]):
            if node.get("@type") == "Product" and node.get("image"):
                img = node["image"]
                img = img[0] if isinstance(img, list) else img
                return img["url"] if isinstance(img, dict) else img
    m = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    return m.group(1) if m else None


def find_product_page(ref, cache_dir):
    page, final = fetch(f"{SITE}/?s={urllib.parse.quote(ref)}&post_type=product", cache_dir)
    if "/product/" in final:
        return (page, final) if page_matches(page, ref) else (None, None)
    links = list(dict.fromkeys(re.findall(rf'href="({SITE}/product/[^"#?]+)"', page)))
    for link in links[:MAX_CANDIDATES]:
        cand, cand_final = fetch(link, cache_dir)
        if page_matches(cand, ref):
            return cand, cand_final
    return None, None


def remove_corner_logo(img):
    """Las fotos de la web llevan el logo "TOLSEN" arriba a la izquierda, separado del
    producto. Si la primera franja con contenido es baja, está en la mitad izquierda y
    hay espacio en blanco debajo, se pinta de blanco para que el recorte se ajuste al
    producto. Si no se cumple todo eso, no se toca nada."""
    w, h = img.size
    mask = ImageChops.difference(img, Image.new("RGB", img.size, "white")).convert("L").point(lambda v: 255 if v > 18 else 0)
    rows = [mask.crop((0, y, w, y + 1)).getbbox() for y in range(h)]
    first = next((y for y, r in enumerate(rows) if r), None)
    if first is None or first > h * 0.15:
        return
    end = first
    while end < h and rows[end]:
        end += 1
    gap = end
    while gap < h and not rows[gap]:
        gap += 1
    band = mask.crop((0, first, w, end)).getbbox()
    if band and end - first < h * 0.10 and gap - end > h * 0.02 and band[2] < w * 0.5:
        margin = max(2, round(h * 0.006))  # el borde suavizado del logo
        img.paste((255, 255, 255), (0, max(first - margin, 0), w, min(end + margin, gap)))


def save_webp(data, out_path):
    img = Image.open(io.BytesIO(data))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, "white")
        img = Image.alpha_composite(bg, img)
    img = img.convert("RGB")
    remove_corner_logo(img)
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.04)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0),
                        min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    img.thumbnail((IMAGE_MAX_SIDE, IMAGE_MAX_SIDE))
    img.save(out_path, "WEBP", quality=85, method=6)
    return img.width, img.height


def main(out_dir):
    out = Path(out_dir)
    cache_dir = out / ".cache"
    cache_dir.mkdir(exist_ok=True)
    catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))

    # Una foto por tarjeta del PDF: agrupar productos por su archivo de imagen original.
    cards = {}
    for p in catalog["products"]:
        if p["images"]:
            original = p["images"][0].get("pdfUrl") or p["images"][0]["url"]
            cards.setdefault(original, []).append(p)

    results = {}
    for i, (original, products) in enumerate(cards.items(), 1):
        refs = [p["reference"] for p in products]
        found = None
        for ref in refs:
            try:
                page, page_url = find_product_page(ref, cache_dir)
                if page and (img_url := main_image_url(page)):
                    found = (ref, page_url, img_url)
                    break
            except Exception as e:  # red o página rara: se deja la foto del PDF
                print(f"  ! {ref}: {e}")
        if not found:
            results[original] = {"refs": refs, "status": "sin coincidencia"}
            print(f"[{i}/{len(cards)}] {refs[0]}: sin coincidencia")
            continue
        ref, page_url, img_url = found
        data, _ = fetch(img_url, cache_dir, binary=True)
        fname = Path(original).stem + "-hd.webp"
        w, h = save_webp(data, out / "images" / fname)
        results[original] = {"refs": refs, "status": "ok", "matchedRef": ref, "page": page_url,
                             "source": img_url, "file": f"images/{fname}", "width": w, "height": h}
        for p in products:
            img = p["images"][0]
            img.setdefault("pdfUrl", original)
            img.update({"url": f"images/{fname}", "width": w, "height": h, "needsReview": False,
                        "officialImage": True})
        print(f"[{i}/{len(cards)}] {refs[0]}: ok ({w}x{h}) {page_url}")

    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "official_images.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(r["status"] == "ok" for r in results.values())
    print(f"\nFotos oficiales: {ok} de {len(results)} tarjetas")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "backend/catalog/output")
