"""Agrega a cada producto la descripción y la ficha técnica oficial de Tolsen.

Uso:
    python -I backend/catalog/enrich_official_data.py backend/catalog/output

Requiere haber corrido fetch_official_images.py (usa sus páginas en .cache/) y
OPENAI_API_KEY en backend/.env.supabase.

Para cada página oficial (puede cubrir varias referencias del catálogo):
1. Extrae el nombre oficial, las características (viñetas) y la fila de la tabla
   "STOCK NO." de cada referencia.
2. Pide a OpenAI traducir al español sin agregar nada y verificar que el producto
   del PDF (nombre y presentación) corresponde al oficial.
3. Guarda en catalog.json: description (viñetas en español), specs (se suman los
   datos de la tabla oficial a la presentación del PDF), sourceUrl y
   officialCheck {ok, note}. Lo que no concuerda va a enrich_report.md.

Las respuestas de OpenAI se guardan en .cache/enrich-*.json para no repetirlas.
"""
import hashlib
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

MODEL = "gpt-5.4-mini"
ENV_FILE = Path(__file__).resolve().parent.parent / ".env.supabase"
SKIP_COLUMNS = {"QTY./CARTON", "QTY/CARTON", "QTY. / CARTON", "CARTON QTY"}  # dato de mayoreo

PROMPT = """Eres un asistente que prepara fichas de producto para el catálogo en español de un distribuidor de herramientas Tolsen.

Recibes la información OFICIAL del fabricante (en inglés) y los productos del catálogo del distribuidor (en español) que se asociaron a esa página por su número de referencia.

Tareas:
1. Traduce al español las características oficiales (features), una por línea, de forma fiel. No agregues, no resumas ni inventes nada. Conserva números, unidades, normas y códigos tal cual (por ejemplo "EN20345-S1P", "60mV", "4xAA (1.5V)"). Omite la línea de empaque ("Packing").
2. Para cada referencia, traduce los encabezados de su fila de la tabla oficial a nombres cortos en español (SIZE -> Medida, LENGTH -> Largo, CAPACITY -> Capacidad, US/UK/EU -> Talla US/UK/EU, etc.) y copia los valores exactos. Quita el símbolo "#" de las tallas.
3. Verifica cada referencia: ¿el nombre en español del catálogo describe el mismo tipo de producto que el nombre oficial? ¿la presentación del catálogo (si existe) es compatible con su fila oficial (mismas medidas o cantidades, aunque una esté en mm y otra en pulgadas)? ok = true solo si ambas cosas concuerdan. En note explica en español, en una frase corta, cualquier diferencia; deja note vacío si todo concuerda."""

SCHEMA = {
    "type": "object",
    "properties": {
        "features_es": {"type": "array", "items": {"type": "string"}},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "reference": {"type": "string"},
                    "specs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"name": {"type": "string"}, "value": {"type": "string"}},
                            "required": ["name", "value"],
                            "additionalProperties": False,
                        },
                    },
                    "ok": {"type": "boolean"},
                    "note": {"type": "string"},
                },
                "required": ["reference", "specs", "ok", "note"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["features_es", "items"],
    "additionalProperties": False,
}


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def parse_page(page):
    title = text(re.search(r'<h1[^>]*product_title[^>]*>(.*?)</h1>', page, re.S).group(1))
    m = re.search(r'woocommerce-product-details__short-description">(.*?)</div>', page, re.S)
    short = m.group(1) if m else ""
    before_table = short.split("<table")[0]
    lines = [text(l) for l in re.split(r"<br\s*/?>|</p>|<p[^>]*>", before_table)]
    features, current = [], None
    for line in lines:
        if not line:
            continue
        if line.startswith("•"):
            current = line.lstrip("• ").strip()
            features.append(current)
        elif features:  # continuación de la viñeta anterior
            features[-1] = f"{features[-1]} {line}"
        else:
            features.append(line)
    rows = []
    for table in re.findall(r"<table.*?</table>", short, re.S):
        for tr in re.findall(r"<tr.*?</tr>", table, re.S):
            rows.append([text(td) for td in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)])
    header = next((r for r in rows if r and "STOCK" in r[0].upper()), None)
    table = {}
    if header:
        for r in rows:
            if r is header or not r:
                continue
            cells = {h: v for h, v in zip(header[1:], r[1:]) if h.upper() not in SKIP_COLUMNS and v}
            for ref in re.findall(r"[A-Z]?\d{5}(?:-[A-Z0-9]+)?", r[0]):
                table[ref] = cells
    return title, features, table


def openai_key():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("Falta OPENAI_API_KEY en backend/.env.supabase")


def ask(payload, cache_dir, key):
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    path = cache_dir / f"enrich-{hashlib.sha1((MODEL + PROMPT + raw).encode()).hexdigest()[:16]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    body = {
        "model": MODEL,
        "instructions": PROMPT,
        "input": raw,
        "reasoning": {"effort": "low"},
        "store": False,
        "text": {"format": {"type": "json_schema", "name": "ficha", "strict": True, "schema": SCHEMA}},
    }
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
    out = "".join(c["text"] for item in data["output"] if item["type"] == "message"
                  for c in item["content"] if c["type"] == "output_text")
    result = json.loads(out)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def main(out_dir):
    sys.stdout.reconfigure(encoding="utf-8")  # nombres oficiales con ″, Ω…
    out = Path(out_dir)
    cache = out / ".cache"
    catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))
    official = json.loads((out / "official_images.json").read_text(encoding="utf-8"))
    pages = {m.read_text(): m.with_suffix("") for m in cache.glob("*.url")}
    key = openai_key()

    by_card = {}
    for p in catalog["products"]:
        if p["images"]:
            by_card.setdefault(p["images"][0].get("pdfUrl") or p["images"][0]["url"], []).append(p)

    # Agrupar tarjetas por página oficial: una consulta por página.
    by_page = {}
    for card, info in official.items():
        if info.get("status") == "ok":
            by_page.setdefault(info["page"], []).extend(by_card.get(card, []))

    # Partir siempre de los datos del PDF: así una página que se descarta
    # (REJECTED en fetch_official_images.py) no deja datos de otro producto.
    for p in catalog["products"]:
        p.setdefault("pdfSpecs", p["specs"])
        p["specs"] = dict(p["pdfSpecs"])
        for k in ("description", "sourceUrl", "officialName", "officialCheck"):
            p.pop(k, None)

    report = []
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    for n, (url, products) in enumerate(list(by_page.items())[:limit], 1):
        title, features, table = parse_page(pages[url].read_text(encoding="utf-8"))
        payload = {
            "official": {"title": title, "features": features,
                         "table": {p["reference"]: table.get(p["reference"], {}) for p in products}},
            "catalog": [{"reference": p["reference"], "name_es": p["name"],
                         "presentacion": p["specs"].get("Presentación", "")} for p in products],
        }
        try:
            result = ask(payload, cache, key)
        except Exception as e:  # se reintenta en la próxima corrida
            print(f"[{n}/{len(by_page)}] {title}: error {e}")
            continue
        items = {i["reference"]: i for i in result["items"]}
        for p in products:
            item = items.get(p["reference"], {"specs": [], "ok": False, "note": "sin respuesta para esta referencia"})
            if not table.get(p["reference"]) and not any(p["reference"] in r for r in table):
                item["ok"] = False
                item["note"] = (item["note"] + " " if item["note"] else "") + "la referencia no está en la tabla oficial"
            p["description"] = "\n".join(f"• {f}" for f in result["features_es"]) or None
            specs = {"Presentación": p["specs"]["Presentación"]} if p["specs"].get("Presentación") else {}
            specs.update({s["name"]: s["value"] for s in item["specs"] if s["value"]})
            specs.update({k: v for k, v in p["specs"].items() if k != "Presentación"})
            p["specs"] = specs
            p["sourceUrl"] = url
            p["officialName"] = title
            p["officialCheck"] = {"ok": item["ok"], "note": item["note"]}
            if not item["ok"]:
                report.append((p["reference"], p["name"], title, p["specs"].get("Presentación", ""), item["note"], url))
        print(f"[{n}/{len(by_page)}] {title}: {len(products)} producto(s)")

    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# Fichas oficiales: diferencias a revisar", "",
             f"{len(report)} productos donde el PDF y la ficha oficial de Tolsen no concuerdan del todo.", "",
             "| Ref. | Nombre (PDF) | Nombre oficial | Presentación (PDF) | Diferencia |", "|---|---|---|---|---|"]
    lines += [f"| [{r}]({u}) | {n} | {t} | {s} | {note} |" for r, n, t, s, note, u in sorted(report)]
    (out / "enrich_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nListo. {sum(len(v) for v in by_page.values())} productos con ficha oficial; {len(report)} para revisar.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "backend/catalog/output")
