"""Completa la ficha de los productos visibles que todavía no tienen descripción.

Uso:
    python -I backend/catalog/marcas/complete_missing.py [--dry-run]

Para cada producto visible sin `description` que viene de un documento del usuario:
1. Búsqueda web más amplia (más intentos; identifica el modelo con todos los datos del
   nombre, no solo con el código de Intrade, que a veces es interno; acepta fichas de
   distribuidores oficiales). Se acepta solo si los números concuerdan con el nombre.
2. Si no hay ficha en internet: "ficha básica" armada SOLO con los datos del nombre del
   documento (sin búsqueda y sin agregar nada), para que todos tengan descripción y
   características ordenadas.
Actualiza name (si el del documento venía cortado), description y specs en Supabase.
Informe: backend/catalog/marcas/complete_report.md
"""
import concurrent.futures as cf
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_brand as bb  # noqa: E402
import publish_docs as pd  # noqa: E402
from lookup_missing import SITES  # noqa: E402

CACHE = HERE / "docs" / ".cache"
WORKERS = 3  # la PC se queda sin memoria con más

WIDE_PROMPT = """Preparas fichas de producto en español para un distribuidor de seguridad electrónica en Costa Rica.
Recibes marca, un código de distribuidor (puede ser interno, no del fabricante) y el nombre del producto en español (puede venir cortado con "...").
1. Identifica el modelo exacto del fabricante usando TODOS los datos del nombre (tipo de producto, capacidades, medidas, modelo si aparece).
2. Busca su ficha técnica: primero el sitio del fabricante ({site}); si no hay, catálogos o fichas de distribuidores oficiales de la marca.
Responde SOLO con JSON:
{{"found": bool, "model": str, "name_es": str, "features_es": [str], "specs": [{{"name": str, "value": str}}], "sources": [str]}}
- found: true solo si la fuente describe un producto con los MISMOS datos del nombre (mismas capacidades/medidas).
- name_es: nombre comercial completo en español, en MAYÚSCULAS, sin marca ni modelo.
- features_es: hasta 8 características de la ficha, traducidas fielmente. specs: 5 a 12 datos de la ficha con unidades. No inventes.
Si no lo encuentras, found=false y listas vacías."""

BASIC_PROMPT = """Recibes el nombre de un producto tal como lo publica el distribuidor (en español, puede venir cortado con "...").
Arma una ficha básica usando SOLO los datos que dice el nombre, sin agregar ninguno:
- name_es: el nombre en MAYÚSCULAS, sin la marca ni el precio, quitando el "..." y la última palabra si quedó cortada.
- features_es: 2 a 6 frases cortas que expliquen lo que dice el nombre (ej. "Montaje en pared", "Capacidad de 9U").
- specs: los datos del nombre como pares nombre/valor (ej. Tipo: Gabinete de pared; Unidades: 9U; Alto: 50 cm).
No uses conocimiento externo. Si un dato no está en el nombre, no lo pongas."""

BASIC_SCHEMA = {"type": "object", "properties": {
    "name_es": {"type": "string"}, "features_es": {"type": "array", "items": {"type": "string"}},
    "specs": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}, "value": {"type": "string"}},
                                          "required": ["name", "value"], "additionalProperties": False}}},
    "required": ["name_es", "features_es", "specs"], "additionalProperties": False}


def responses(body, api_key):
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.load(resp)
    return "".join(c.get("text", "") for o in data["output"] if o["type"] == "message" for c in o["content"])


def cached(name, fn):
    path = CACHE / name
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    result = fn()
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def wide_lookup(brand, sku, raw, api_key):
    def run():
        body = {"model": bb.MODEL, "tools": [{"type": "web_search"}], "max_tool_calls": 7, "reasoning": {"effort": "medium"},
                "store": False, "instructions": WIDE_PROMPT.format(site=SITES.get(brand[0]) or "el fabricante"),
                "input": f"Marca: {brand[1]}. Código del distribuidor: {sku}. Nombre: {raw}"}
        m = re.search(r"\{.*\}", responses(body, api_key), re.S)
        return json.loads(m.group(0)) if m else {"found": False}
    return cached(f"wide-{hashlib.sha1(f'{brand[0]}|{sku}|{raw}'.encode()).hexdigest()[:16]}.json", run)


def basic_sheet(raw, api_key):
    def run():
        body = {"model": bb.MODEL, "instructions": BASIC_PROMPT, "input": raw, "reasoning": {"effort": "low"}, "store": False,
                "text": {"format": {"type": "json_schema", "name": "ficha", "strict": True, "schema": BASIC_SCHEMA}}}
        return json.loads(responses(body, api_key))
    return cached(f"basic-{hashlib.sha1(raw.encode()).hexdigest()[:16]}.json", run)


def main(dry_run):
    sys.stdout.reconfigure(encoding="utf-8")
    CACHE.mkdir(parents=True, exist_ok=True)
    e = pd.env()
    base, skey, api_key = e["SUPABASE_URL"].rstrip("/"), e["SUPABASE_SERVICE_ROLE_KEY"], e["OPENAI_API_KEY"]
    sb = {"apikey": skey, "Authorization": f"Bearer {skey}", "Content-Type": "application/json"}
    rows, off = [], 0
    while True:
        page = pd.http("GET", f"{base}/rest/v1/products?select=id,reference,name,brand_id,specs&available=eq.true"
                              f"&discontinued=eq.false&description=is.null&order=id&limit=1000&offset={off}", sb)
        rows += page
        if len(page) < 1000:
            break
        off += 1000
    # Datos del documento de cada producto (por marca y código).
    docs = {}
    for doc_name, (bid, bname, _) in pd.BRANDS.items():
        path = bb.DOCS / f"{doc_name}.docx"
        if path.exists():
            for sku, raw, _ in bb.read_doc(path):
                docs[(bid, pd.key(sku))] = (sku, raw, bname)
    jobs = []
    for r in rows:
        codes = [(r["specs"] or {}).get("Código Intrade"), r["reference"]]
        doc = next((docs[(r["brand_id"], pd.key(c))] for c in codes if c and (r["brand_id"], pd.key(c)) in docs), None)
        if doc:
            jobs.append((r, doc))
    print(f"{len(rows)} visibles sin descripción; {len(jobs)} con datos de documento", flush=True)
    if dry_run:
        return

    def work(job):
        r, (sku, raw, bname) = job
        try:
            info = wide_lookup((pd.LEGACY_PREFIX.get(r["brand_id"], r["brand_id"]), bname), sku, raw, api_key)
            if info.get("found") and info.get("sources") and bb.agrees(raw, info) and info.get("features_es"):
                return r, sku, raw, info, "web"
            return r, sku, raw, basic_sheet(raw, api_key), "basica"
        except Exception as ex:
            return r, sku, raw, None, f"error {ex}"

    report = {"web": [], "basica": [], "error": []}
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        for n, (r, sku, raw, info, how) in enumerate(pool.map(work, jobs), 1):
            if info is None:
                report["error"].append(f"{r['id']}: {how}")
                print(f"[{n}/{len(jobs)}] {r['id']}: {how}", flush=True)
                continue
            specs = {"Código Intrade": sku, **{s["name"]: s["value"] for s in info.get("specs", []) if s.get("name") and s.get("value")}}
            patch = {"description": "\n".join(f"• {f}" for f in info["features_es"]) or None, "specs": specs}
            if raw.rstrip().endswith(("...", "…")) and info.get("name_es"):
                patch["name"] = info["name_es"].strip().upper()
            if how == "web":
                patch["source_url"] = info["sources"][0]
                if info.get("model"):
                    patch["official_name"] = info["model"]
            pd.http("PATCH", f"{base}/rest/v1/products?id=eq.{r['id']}", {**sb, "Prefer": "return=minimal"}, patch)
            report[how].append(f"{r['brand_id']} · {sku} · {patch.get('name', r['name'])[:70]}")
            print(f"[{n}/{len(jobs)}] {r['id']}: {how}", flush=True)
    lines = ["# Productos completados", "",
             f"Con ficha web (búsqueda amplia): {len(report['web'])}. Con ficha básica (datos del nombre): {len(report['basica'])}. "
             f"Errores: {len(report['error'])}.", "",
             "## Ficha básica armada con el nombre del documento (no se encontró ficha en internet)", ""]
    lines += [f"- {x}" for x in sorted(report["basica"])] + ["", "## Errores", ""] + [f"- {x}" for x in report["error"]]
    (HERE / "complete_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nweb: {len(report['web'])} | básica: {len(report['basica'])} | errores: {len(report['error'])}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
