"""Busca en dahuasecurity.com los modelos Dahua de Intrade que todavía no tenemos.

Uso (después de intrade_dahua.py):
    python -I backend/catalog/dahua/search_dahua.py

Para cada SKU de intrade_models.json que no esté ya en output/catalog.json, consulta el
buscador oficial (/la/search?keyword=MODELO) y guarda el resultado que coincide
exactamente con el modelo: nombre oficial (inglés), página y foto. Respeta el
Crawl-delay: 100 de dahuasecurity.com, así que es lento (~100 s por modelo); se puede
cortar y retomar porque guarda cada respuesta en .cache/search-*.json.
"""
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
DELAY_S = 100
UA = "Mozilla/5.0 (JC Security catalog sync)"


def key(code):
    k = re.sub(r"[^a-z0-9]", "", (code or "").lower())
    return re.sub(r"^dhi?(?=[a-z]{2,})", "", k)


def clean_sku(sku):
    """El SKU de Intrade a veces trae el prefijo DH-/DHI- o espacios."""
    return re.sub(r"^DHI?-", "", (sku or "").strip().upper())


def slug_model(slug):
    """Modelo con guiones al final de la dirección de Intrade (…-dh-ipc-hfw3449t1-zas-pv-pro)."""
    m = re.search(r"(?:^|-)dh[iu]?-([a-z0-9]+(?:-[a-z0-9]+)+)$", slug)
    return m.group(1).upper() if m else None


def query_for(item):
    """El buscador de Dahua necesita el modelo con guiones; el SKU de Intrade a veces no los trae."""
    from_slug = slug_model(item["slug"])
    if from_slug and (not item["sku"] or key(from_slug) == key(item["sku"])):
        return from_slug
    return clean_sku(item["sku"]) if item["sku"] else from_slug


def parse_results(page):
    out = []
    block = page.split('id="searchProducts"', 1)[-1].split("</ul>", 1)[0]
    for li in re.findall(r"<li>(.*?)</li>", block, re.S):
        url = re.search(r'<a href="([^"]+)"', li)
        img = re.search(r'search-products-img">\s*<img src="([^"]+)"\s*alt="([^"]*)"', li)
        name = re.findall(r'<div class="search-products-[a-z-]*name[^"]*"[^>]*>(.*?)</div>', li, re.S)
        text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", li))).strip()
        if url and img:
            out.append({"url": url.group(1), "image": img.group(1), "model": img.group(2).strip(),
                        "text": text, "discontinued": "Discontinued" in li})
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    CACHE.mkdir(exist_ok=True)
    intrade = json.loads((HERE / "intrade_models.json").read_text(encoding="utf-8"))
    have = set()
    cat = HERE / "output" / "catalog.json"
    if cat.exists():
        for p in json.loads(cat.read_text(encoding="utf-8"))["products"]:
            have.add(key(p["reference"]))
            have.add(key((p.get("specs") or {}).get("Código Dahua CR")))
    todo = [query_for(m) for m in intrade if (m["sku"] or slug_model(m["slug"]))
            and key(m["sku"] or slug_model(m["slug"])) not in have]
    todo = list(dict.fromkeys(todo))
    pending = [m for m in todo if not (CACHE / f"search-{key(m)}.json").exists()]
    print(f"{len(todo)} modelos por buscar; {len(pending)} sin respuesta guardada (~{len(pending) * DELAY_S // 60} min)", flush=True)
    for i, model in enumerate(pending, 1):
        time.sleep(DELAY_S)
        url = "https://www.dahuasecurity.com/la/search?keyword=" + urllib.parse.quote(model)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as resp:
                results = parse_results(resp.read().decode("utf-8", "replace"))
        except Exception as e:
            print(f"[{i}/{len(pending)}] {model}: error {e}", flush=True)
            continue
        exact = [r for r in results if key(r["model"]) == key(model)]
        (CACHE / f"search-{key(model)}.json").write_text(
            json.dumps({"query": model, "exact": exact, "results": results}, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[{i}/{len(pending)}] {model}: {'ok' if exact else 'sin coincidencia exacta'} ({len(results)} resultados)", flush=True)


if __name__ == "__main__":
    main()
