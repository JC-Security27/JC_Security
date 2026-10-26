"""Sube a Supabase el catálogo generado por extract_catalog.py.

Uso:
    python -I backend/catalog/load_catalog.py backend/catalog/output [--dry-run]

Lee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de backend/.env.supabase (o del
entorno). La service role key solo se usa aquí, nunca en el frontend.

Antes, aplicar backend/supabase/migrations/0001_catalogo.sql en el SQL Editor.
Pasos: sube las fotos al bucket "catalogo" y hace upsert de marcas,
categorías, productos e imágenes. Se puede ejecutar varias veces.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

BUCKET = "catalogo"
ENV_FILE = Path(__file__).resolve().parent.parent / ".env.supabase"


def load_env():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            key, sep, value = line.partition("=")
            if sep and not line.lstrip().startswith("#"):
                os.environ.setdefault(key.strip(), value.strip().strip('"'))
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        sys.exit(f"Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (en {ENV_FILE} o en el entorno).")
    return url, key


def request(method, url, key, body=None, headers=None):
    data = body if isinstance(body, bytes) or body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": key, "Authorization": f"Bearer {key}", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url} -> {e.code}: {e.read().decode(errors='replace')}")


def upsert(base, key, table, rows, on_conflict):
    for i in range(0, len(rows), 200):
        request("POST", f"{base}/rest/v1/{table}?on_conflict={on_conflict}", key, rows[i:i + 200], {
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        })
    print(f"  {table}: {len(rows)}")


def main(out_dir, dry_run):
    out = Path(out_dir)
    catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))
    base, key = ("https://<proyecto>.supabase.co", "") if dry_run else load_env()
    public = f"{base}/storage/v1/object/public/{BUCKET}"

    brands = [{"id": b["id"], "name": b["name"], "logo_url": b.get("logoUrl")} for b in catalog["brands"]]
    categories = [{"id": c["id"], "slug": c["slug"], "name": c["name"], "description": c.get("description"),
                   "image_url": c.get("imageUrl"), "parent_slug": c.get("parentSlug"), "position": c.get("position", i)}
                  for i, c in enumerate(catalog["categories"])]
    products, images, files = [], [], set()
    for p in catalog["products"]:
        products.append({
            "id": p["id"], "reference": p["reference"], "name": p["name"],
            "category_slug": p["categorySlug"], "brand_id": p.get("brandId"),
            "description": p.get("description"), "specs": p.get("specs") or {},
            "is_service": p.get("isService", False), "is_new": p.get("isNew", False),
            "discontinued": p.get("discontinued", False), "source_page": p["source"]["page"],
            "variant_group_id": p.get("variantGroupId"), "size_label": p.get("sizeLabel"),
            "source_url": p.get("sourceUrl"), "official_name": p.get("officialName"),
        })
        for pos, img in enumerate(p["images"]):
            name = Path(img["url"]).name
            files.add(name)
            images.append({"product_id": p["id"], "url": f"{public}/{name}", "alt": img["alt"],
                           "width": img.get("width"), "height": img.get("height"),
                           "needs_review": img.get("needsReview", False), "position": pos})

    if dry_run:
        print(f"{len(brands)} marcas, {len(categories)} categorías, {len(products)} productos, "
              f"{len(images)} imágenes ({len(files)} archivos). Ejemplo de URL: {images[0]['url']}")
        return

    print(f"Subiendo {len(files)} fotos al bucket '{BUCKET}'...")
    for name in sorted(files):
        request("POST", f"{base}/storage/v1/object/{BUCKET}/{name}", key, (out / "images" / name).read_bytes(),
                {"Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "max-age=31536000"})
    print("Cargando tablas...")
    upsert(base, key, "brands", brands, "id")
    upsert(base, key, "categories", categories, "id")
    upsert(base, key, "products", products, "id")
    upsert(base, key, "product_images", images, "product_id,position")
    print("Listo.")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else "backend/catalog/output", "--dry-run" in sys.argv)
