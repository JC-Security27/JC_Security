"""Lista exacta de productos Dahua que Intrade tiene en stock, con su SKU.

Uso (después de sync_intrade.py, que guarda backend/catalog/intrade_snapshot.json):
    python -I backend/catalog/dahua/intrade_dahua.py

De cada página de producto de intradeabc.com solo se lee el campo SKU (el código del
producto). No se guardan ni se copian fotos, textos ni el HTML. Ritmo lento (DELAY_S).
Salida: intrade_models.json  [{slug, sku}]
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
SNAPSHOT = HERE.parent / "intrade_snapshot.json"
OUT = HERE / "intrade_models.json"
DELAY_S = 3
UA = "Mozilla/5.0 (JC Security availability check)"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    slugs = [s for s in json.loads(SNAPSHOT.read_text(encoding="utf-8"))["en_stock"] if "dahua" in s.lower()]
    known = {m["slug"]: m["sku"] for m in json.loads(OUT.read_text(encoding="utf-8"))} if OUT.exists() else {}
    result = []
    for i, slug in enumerate(slugs, 1):
        if slug in known:
            result.append({"slug": slug, "sku": known[slug]})
            continue
        time.sleep(DELAY_S)
        req = urllib.request.Request(f"https://intradeabc.com/producto/{slug}/", headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                page = resp.read().decode("utf-8", "replace")
            m = re.search(r'<span class="sku">\s*([^<]+?)\s*</span>', page)
            sku = m.group(1).strip() if m else None
        except urllib.error.URLError as e:
            print(f"[{i}/{len(slugs)}] error {e}", flush=True)
            continue
        result.append({"slug": slug, "sku": sku})
        print(f"[{i}/{len(slugs)}] {sku}", flush=True)
        OUT.write_text(json.dumps(result, ensure_ascii=False, indent=0), encoding="utf-8")
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(result)} productos Dahua en stock en Intrade; sin SKU: {sum(1 for r in result if not r['sku'])}")


if __name__ == "__main__":
    main()
