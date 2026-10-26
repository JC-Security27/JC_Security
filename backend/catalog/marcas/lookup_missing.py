"""Busca la ficha oficial solo de los productos de los documentos que todavía no la tienen.

Uso:
    python -I backend/catalog/marcas/lookup_missing.py
    python -I backend/catalog/marcas/publish_docs.py        # aplica lo encontrado
    python -I backend/catalog/load_catalog.py backend/catalog/marcas/docs/output

Usa la misma búsqueda y caché que build_brand.py (OpenAI con búsqueda web), así que
publish_docs.py encuentra los resultados. No vuelve a buscar lo que ya está en caché.
"""
import concurrent.futures as cf
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_brand as bb  # noqa: E402
import publish_docs as pd  # noqa: E402

SITES = {  # sitio oficial de cada marca (para orientar la búsqueda)
    "ajax": "ajax.systems", "argos": "", "cdp": "cdpenergy.com", "cdvi": "cdvi.com", "dahua": "dahuasecurity.com",
    "dexson": "dexson.com", "dlx": "", "eleksteel": "", "enforcer": "seco-larm.com", "fire-lite": "firelite.com",
    "forza": "forzaups.com", "general-electric": "", "gerfor": "gerfor.com", "hagroy": "", "imou": "imoulife.com",
    "keri-systems": "kerisys.com", "lantek": "", "mercusys": "mercusys.com", "mircom": "mircom.com",
    "optex": "optexamerica.com", "paradox": "paradox.com", "pkcell": "pkcell.net", "polidlex": "", "reyee": "reyee.ruijie.com",
    "sabo": "", "sti": "sti-usa.com", "tolsen": "tolsentools.com", "tp-link": "tp-link.com", "trendnet": "trendnet.com",
    "western-digital": "westerndigital.com", "zkteco": "zkteco.com",
}
WORKERS = 3  # menos en paralelo: la PC se quedó sin memoria con 8


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    api_key = bb.openai_key()
    jobs = []
    for doc_name, (bid, bname, _) in pd.BRANDS.items():
        path = bb.DOCS / f"{doc_name}.docx"
        if not path.exists():
            continue
        published = json.loads((pd.OUT / "catalog.json").read_text(encoding="utf-8"))["products"]
        pending = {p["specs"]["Código Intrade"] for p in published if p["brandId"] == bid and not p["description"]}
        brand = {"id": bid, "name": bname, "site": SITES.get(bid, "")}
        cache = HERE / bid / ".cache"
        cache.mkdir(parents=True, exist_ok=True)
        jobs += [(brand, sku, raw, cache) for sku, raw, _ in bb.read_doc(path) if sku in pending]
    print(f"{len(jobs)} productos sin ficha; buscando con {WORKERS} en paralelo", flush=True)

    def work(job):
        brand, sku, raw, cache = job
        try:
            info = bb.lookup(brand, sku, raw, api_key, cache)
            return brand["id"], sku, bool(info.get("found")) and bb.agrees(raw, info)
        except Exception as e:  # se reintenta en la próxima corrida
            return brand["id"], sku, f"error {e}"

    done = 0
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        for bid, sku, ok in pool.map(work, jobs):
            done += 1
            print(f"[{done}/{len(jobs)}] {bid} {sku}: {ok}", flush=True)


if __name__ == "__main__":
    main()
