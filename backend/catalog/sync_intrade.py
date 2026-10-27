"""Marca como disponibles solo los productos que Intrade tiene en su catálogo.

Uso:
    python -I backend/catalog/sync_intrade.py [--dry-run]

Regla del negocio (2026-10-26): JC Security solo ofrece lo que Intrade tiene
disponible. Este script:
1. Recorre el listado público del catálogo de intradeabc.com (/productos/page/N/),
   despacio (DELAY_S entre páginas). De cada producto solo toma su dirección (lleva el
   código o modelo) y si está "instock"; no guarda ni copia fotos ni textos. (Su
   sitemap está desactualizado desde agosto 2026, por eso no se usa.)
2. Para cada producto de Supabase busca su referencia (y el código Dahua CR, si lo
   tiene) en esas direcciones.
3. Actualiza products.available y available_checked. Lo no disponible queda oculto
   por RLS; cuando Intrade lo agregue, la próxima corrida lo vuelve a mostrar.
Escribe backend/catalog/intrade_report.md.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENV_FILE = HERE.parent / ".env.supabase"
LISTING = "https://intradeabc.com/productos/page/{n}/"
DELAY_S = 3
UA = "Mozilla/5.0 (JC Security availability check)"


def env():
    # En GitHub Actions las claves llegan como secretos (variables de entorno).
    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        return os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    vals = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        k, sep, v = line.partition("=")
        if sep and not line.startswith("#"):
            vals[k.strip()] = v.strip()
    return vals["SUPABASE_URL"].rstrip("/"), vals["SUPABASE_SERVICE_ROLE_KEY"]


SKUS = {}  # dirección -> código que Intrade muestra en el listado


def fetch_listing(n, tries=4):
    """Página n del listado de Intrade, con reintentos (a veces corta la conexión).
    Devuelve None cuando la página no existe (fin del listado)."""
    for attempt in range(tries):
        try:
            req = urllib.request.Request(LISTING.format(n=n), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == tries - 1:
                raise
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError):
            if attempt == tries - 1:
                raise
        time.sleep(10 * (attempt + 1))


def intrade_slugs():
    """Direcciones de los productos que Intrade tiene en stock (y cuántos están agotados)."""
    in_stock, out_of_stock, n = [], 0, 1
    while True:
        page = fetch_listing(n)
        if page is None:  # se acabaron las páginas
            break
        items = re.findall(r'<li class="([^"]*\btype-product\b[^"]*)">\s*<a href="https://intradeabc\.com/producto/([^"/]+)/?"'
                           r'(.*?)</li>', page, re.S)
        if not items:
            break
        for classes, slug, rest in items:
            if "outofstock" in classes.split():
                out_of_stock += 1
            else:
                sku = re.search(r'<span class="intrade-sku">\s*([^<]+?)\s*</span>', rest)
                in_stock.append(slug)
                SKUS[slug] = sku.group(1) if sku else None
        print(f"  página {n}: {len(items)} productos", flush=True)
        n += 1
        time.sleep(DELAY_S)
    if len(in_stock) < 200:  # no se pudo leer bien: mejor no ocultar todo el catálogo
        sys.exit(f"Catálogo de Intrade incompleto ({len(in_stock)} productos); no se cambia nada.")
    print(f"Intrade: {len(in_stock)} en stock, {out_of_stock} agotados")
    # Copia de la lista (solo direcciones) para los scripts de cada marca.
    (HERE / "intrade_snapshot.json").write_text(json.dumps(
        {"fecha": datetime.now(timezone.utc).isoformat(), "en_stock": in_stock, "sku": SKUS}, indent=0), encoding="utf-8")
    return in_stock


def norm(code):
    k = re.sub(r"[^a-z0-9]", "", (code or "").lower())
    return re.sub(r"^dhi?(?=[a-z]{2,})", "", k)


def is_available(product, slugs, slugs_alnum):
    ref = product["reference"]
    specs = product.get("specs") or {}
    # 1) Código contra código: el que Intrade muestra en su listado.
    sku_set = {norm(s) for s in SKUS.values() if s}
    if any(norm(c) in sku_set for c in (ref, specs.get("Código Intrade"), specs.get("Código Dahua CR")) if c and len(norm(c)) >= 3):
        return True
    if re.fullmatch(r"[A-Z]?\d{5}(-[A-Z0-9]+)?", ref):  # Tolsen: número de 5 cifras
        pat = re.compile(rf"(?<![0-9]){re.escape(ref.lower())}(?![0-9])")
        return any(pat.search(s) for s in slugs)
    codes = [ref, specs.get("Código Dahua CR"), specs.get("Código Intrade")]
    if any(len(norm(c)) >= 5 and any(norm(c) in s for s in slugs_alnum) for c in codes if c):
        return True
    # Códigos cortos (Altronix SMP7, AL624…): deben aparecer como palabra completa en la dirección.
    for c in codes:
        if c:
            pat = re.compile(rf"(?<![a-z0-9]){re.escape(c.lower())}(?![a-z0-9])")
            if any(pat.search(s) for s in slugs):
                return True
    return False


def request(method, url, key, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"apikey": key, "Authorization": f"Bearer {key}",
                                          "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def main(dry_run):
    sys.stdout.reconfigure(encoding="utf-8")
    base, key = env()
    slugs = intrade_slugs()
    slugs_alnum = [re.sub(r"[^a-z0-9]", "", s) for s in slugs]
    products, offset = [], 0
    while True:  # Supabase entrega como máximo 1000 filas por consulta: se pide por páginas
        page = json.loads(request("GET", f"{base}/rest/v1/products?select=id,reference,name,brand_id,specs,available"
                                         f"&discontinued=eq.false&order=id&limit=1000&offset={offset}", key))
        products += page
        if len(page) < 1000:
            break
        offset += 1000
    now = datetime.now(timezone.utc).isoformat()
    # Marcas con documento del usuario (Info_Completa): se muestra exactamente lo del documento
    # (lo arma marcas/publish_docs.py). Las demás marcas siguen el stock de Intrade.
    docs_file = HERE / "marcas" / "docs_index.json"
    doc_ids = set(json.loads(docs_file.read_text(encoding="utf-8"))) if docs_file.exists() else set()
    doc_brands = {p["brand_id"] for p in products if p["id"] in doc_ids}
    changes, by_brand = {True: [], False: []}, {}
    for p in products:
        # Opción b (decisión del usuario, 2026-10-26): lo del documento se muestra mientras Intrade
        # lo tenga en stock; lo que no está en el documento de su marca no se muestra.
        in_stock = is_available(p, slugs, slugs_alnum)
        ok = (p["id"] in doc_ids and in_stock) if p["brand_id"] in doc_brands else in_stock
        b = by_brand.setdefault(p["brand_id"], [0, 0])
        b[0 if ok else 1] += 1
        changes[ok].append(p)
    for brand, (yes, no) in sorted(by_brand.items()):
        print(f"  {brand}: {yes} disponibles, {no} ocultos")
    if dry_run:
        return
    # Lo que está en un documento del usuario se vende aunque el PDF original lo marcara EoL.
    revive = ",".join(f'"{x}"' for x in doc_ids)
    if revive:
        request("PATCH", f"{base}/rest/v1/products?discontinued=eq.true&id=in.({revive})", key, {"discontinued": False})
    for value, items in changes.items():
        ids = [p["id"] for p in items]
        for i in range(0, len(ids), 150):
            chunk = ",".join(f'"{x}"' for x in ids[i:i + 150])
            request("PATCH", f"{base}/rest/v1/products?id=in.({chunk})", key,
                    {"available": value, "available_checked": now})
    lines = [f"# Disponibilidad en Intrade — {now[:16].replace('T', ' ')} UTC", "",
             f"Intrade en stock: {len(slugs)} productos. Publicados: {len(changes[True])}. Ocultos: {len(changes[False])}.", "",
             "## Ocultos (no están en Intrade o no están en el documento de su marca)", ""]
    lines += [f"- {p['brand_id']} · {p['reference']} · {p['name']}" for p in sorted(changes[False], key=lambda x: (x["brand_id"], x["reference"]))]
    (HERE / "intrade_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Listo. Detalle en backend/catalog/intrade_report.md")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
