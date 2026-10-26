"""Descarga las páginas oficiales de Dahua de los modelos que vende JC Security.

Uso:
    python -I backend/catalog/dahua/fetch_dahua.py

Lee modelos_intrade.json (modelo -> página oficial en dahuasecurity.com; la
lista de modelos salió del índice público de intradeabc.com, sin copiar su
contenido). Respeta el Crawl-delay: 100 de dahuasecurity.com/robots.txt.
Las páginas quedan en .cache/ y no se vuelven a pedir.
"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
DELAY_S = 100  # robots.txt de dahuasecurity.com
UA = "Mozilla/5.0 (JC Security catalog sync)"


def cache_path(url):
    return CACHE / (re.sub(r"[^A-Za-z0-9._-]+", "_", url.split("dahuasecurity.com")[-1])[:180] + ".html")


def main():
    CACHE.mkdir(exist_ok=True)
    pages = json.loads((HERE / "modelos_intrade.json").read_text(encoding="utf-8"))["pages"]
    pending = [(m, u) for m, u in pages.items() if not cache_path(u).exists()]
    print(f"{len(pages)} modelos, {len(pending)} por descargar (~{len(pending) * DELAY_S // 60} min)", flush=True)
    for i, (model, url) in enumerate(pending, 1):
        time.sleep(DELAY_S)
        req = urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%#+,;@"), headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                cache_path(url).write_bytes(resp.read())
            print(f"[{i}/{len(pending)}] {model}: ok", flush=True)
        except Exception as e:
            print(f"[{i}/{len(pending)}] {model}: error {e}", flush=True)


if __name__ == "__main__":
    main()
