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


def intrade_slugs():
    """Direcciones de los productos que Intrade tiene en stock (y cuántos están agotados)."""
    in_stock, out_of_stock, n = [], 0, 1
    while True:
        req = urllib.request.Request(LISTING.format(n=n), headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                page = resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:  # se acabaron las páginas
                break
            raise
        items = re.findall(r'<li class="([^"]*\btype-product\b[^"]*)">\s*<a href="https://intradeabc\.com/producto/([^"/]+)/?"', page)
        if not items:
            break
        for classes, slug in items:
            if "outofstock" in classes.split():
                out_of_stock += 1
            else:
                in_stock.append(slug)
        print(f"  página {n}: {len(items)} productos", flush=True)
        n += 1
        time.sleep(DELAY_S)
    if len(in_stock) < 200:  # no se pudo leer bien: mejor no ocultar todo el catálogo
        sys.exit(f"Catálogo de Intrade incompleto ({len(in_stock)} productos); no se cambia nada.")
    print(f"Intrade: {len(in_stock)} en stock, {out_of_stock} agotados")
    # Copia de la lista (solo direcciones) para los scripts de cada marca.
    (HERE / "intrade_snapshot.json").write_text(json.dumps(
        {"fecha": datetime.now(timezone.utc).isoformat(), "en_stock": in_stock}, indent=0), encoding="utf-8")
    return in_stock


def norm(code):
    k = re.sub(r"[^a-z0-9]", "", (code or "").lower())
    return re.sub(r"^dhi?(?=[a-z]{2,})", "", k)


def is_available(product, slugs, slugs_alnum):
    ref = product["reference"]
    if re.fullmatch(r"[A-Z]?\d{5}(-[A-Z0-9]+)?", ref):  # Tolsen: número de 5 cifras
        pat = re.compile(rf"(?<![0-9]){re.escape(ref.lower())}(?![0-9])")
        return any(pat.search(s) for s in slugs)
    codes = [ref, (product.get("specs") or {}).get("Código Dahua CR")]
    return any(len(norm(c)) >= 5 and any(norm(c) in s for s in slugs_alnum) for c in codes if c)


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
    products = json.loads(request("GET", f"{base}/rest/v1/products?select=id,reference,name,brand_id,specs,available"
                                         f"&discontinued=eq.false&limit=5000", key))
    now = datetime.now(timezone.utc).isoformat()
    changes, by_brand = {True: [], False: []}, {}
    for p in products:
        ok = is_available(p, slugs, slugs_alnum)
        b = by_brand.setdefault(p["brand_id"], [0, 0])
        b[0 if ok else 1] += 1
        changes[ok].append(p)
    for brand, (yes, no) in sorted(by_brand.items()):
        print(f"  {brand}: {yes} disponibles, {no} ocultos")
    if dry_run:
        return
    for value, items in changes.items():
        ids = [p["id"] for p in items]
        for i in range(0, len(ids), 150):
            chunk = ",".join(f'"{x}"' for x in ids[i:i + 150])
            request("PATCH", f"{base}/rest/v1/products?id=in.({chunk})", key,
                    {"available": value, "available_checked": now})
    lines = [f"# Disponibilidad en Intrade — {now[:16].replace('T', ' ')} UTC", "",
             f"Intrade en stock: {len(slugs)} productos. Publicados: {len(changes[True])}. Ocultos: {len(changes[False])}.", "",
             "## Ocultos (no están en Intrade)", ""]
    lines += [f"- {p['brand_id']} · {p['reference']} · {p['name']}" for p in sorted(changes[False], key=lambda x: (x["brand_id"], x["reference"]))]
    (HERE / "intrade_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Listo. Detalle en backend/catalog/intrade_report.md")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
