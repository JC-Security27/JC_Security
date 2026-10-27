"""Reemplaza las fotos chicas por la foto original en alta resolución de Intrade.

Uso:
    python -I backend/catalog/intrade_images.py [--dry-run]

JC Security tiene el visto bueno de Intrade para usar sus imágenes (confirmado por el
usuario el 2026-10-26). Las fotos de los documentos del usuario son las miniaturas de
300 px del listado de Intrade; este script:
1. Recorre el listado de intradeabc.com y toma, por código (SKU), la imagen más grande
   del srcset (normalmente 1200 px).
2. Para cada producto visible cuya foto actual mide menos de MIN_KEEP px, descarga el
   original, lo deja en fondo blanco y recorte parejo (WebP, 800 px máx.), lo sube al
   bucket como <id>-hq.webp y actualiza product_images.
Las fotos oficiales grandes que ya hay (Tolsen, Dahua, Altronix) no se tocan.
"""
import concurrent.futures as cf
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sync_intrade as si  # noqa: E402

LISTING = "https://intradeabc.com/productos/page/{n}/"
MIN_KEEP = 600   # fotos actuales con lado mayor menor a esto se reemplazan
MIN_NEW = 500    # la de Intrade tiene que ser al menos así de grande para valer la pena
WORKERS = 3
OUT = HERE / "intrade_hq"
UA = "Mozilla/5.0 (JC Security catalog sync)"


def listing_images():
    """{sku normalizado: url de la imagen más grande} del listado de Intrade (se guarda en caché)."""
    cache = OUT / "listing_images.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    images, n = {}, 1
    while True:
        page = si.fetch_listing(n)
        if page is None:
            break
        items = re.findall(r'<li class="[^"]*\btype-product\b[^"]*">(.*?)</li>', page, re.S)
        if not items:
            break
        for li in items:
            sku = re.search(r'<span class="intrade-sku">\s*([^<]+?)\s*</span>', li)
            srcset = re.search(r'srcset="([^"]+)"', li)
            src = re.search(r'<img[^>]+src="([^"]+)"', li)
            if not sku:
                continue
            best = None
            if srcset:
                cands = [(int(w), u) for u, w in re.findall(r"(\S+)\s+(\d+)w", srcset.group(1))]
                best = max(cands)[1] if cands else None
            images[si.norm(sku.group(1))] = best or (src.group(1) if src else None)
        print(f"  listado página {n}: {len(items)}", flush=True)
        n += 1
        time.sleep(si.DELAY_S)
    cache.write_text(json.dumps(images, indent=0), encoding="utf-8")
    return images


def to_webp(data, path):
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    img = Image.alpha_composite(Image.new("RGBA", img.size, "white"), img).convert("RGB")
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.05)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    img.thumbnail((800, 800))
    img.save(path, "WEBP", quality=88, method=6)
    return img.width, img.height


def main(dry_run):
    sys.stdout.reconfigure(encoding="utf-8")
    OUT.mkdir(exist_ok=True)
    base, key = si.env()
    rows, off = [], 0
    while True:
        page = json.loads(si.request("GET", f"{base}/rest/v1/products?select=id,reference,brand_id,specs,product_images(url,width,height,position)"
                                            f"&available=eq.true&discontinued=eq.false&order=id&limit=1000&offset={off}", key))
        rows += page
        if len(page) < 1000:
            break
        off += 1000
    todo = [r for r in rows if not r["product_images"] or max(r["product_images"][0]["width"] or 0, r["product_images"][0]["height"] or 0) < MIN_KEEP]
    print(f"{len(rows)} visibles; {len(todo)} con foto chica (< {MIN_KEEP} px)", flush=True)
    images = listing_images()
    jobs = []
    for r in todo:
        specs = r["specs"] or {}
        url = next((images[si.norm(c)] for c in (specs.get("Código Intrade"), r["reference"], specs.get("Código Dahua CR"))
                    if c and si.norm(c) in images and images[si.norm(c)]), None)
        if url:
            jobs.append((r, url))
    print(f"con foto grande disponible en Intrade: {len(jobs)}", flush=True)
    if dry_run:
        return

    def work(job):
        r, url = job
        try:
            time.sleep(0.5)
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as resp:
                data = resp.read()
            if max(Image.open(io.BytesIO(data)).size) < MIN_NEW:
                return r["id"], "original chico"
            name = f"{r['id']}-hq.webp"
            w, h = to_webp(data, OUT / name)
            req = urllib.request.Request(f"{base}/storage/v1/object/catalogo/{name}", data=(OUT / name).read_bytes(), method="POST",
                                         headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "image/webp",
                                                  "x-upsert": "true", "Cache-Control": "max-age=31536000"})
            urllib.request.urlopen(req, timeout=120).read()
            public = f"{base}/storage/v1/object/public/catalogo/{name}"
            si.request("PATCH", f"{base}/rest/v1/product_images?product_id=eq.{r['id']}&position=eq.0", key,
                       {"url": public, "width": w, "height": h, "needs_review": False})
            return r["id"], f"ok {w}x{h}"
        except Exception as e:
            return r["id"], f"error {e}"

    done = {"ok": 0, "otro": 0}
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        for n, (pid, res) in enumerate(pool.map(work, jobs), 1):
            done["ok" if res.startswith("ok") else "otro"] += 1
            print(f"[{n}/{len(jobs)}] {pid}: {res}", flush=True)
    print(f"\nFotos reemplazadas: {done['ok']} | sin cambio: {done['otro']}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
