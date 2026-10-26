"""Publica TODOS los productos de los documentos del usuario (backend/catalog/Info_Completa/*.docx).

Uso:
    python -I backend/catalog/marcas/publish_docs.py            # arma y publica
    python -I backend/catalog/marcas/publish_docs.py --dry-run  # solo cuenta

Regla del usuario (2026-10-26): todo lo que está en esos documentos (foto, código y
nombre; el precio no) tiene que salir en la página. Por marca:
- Productos que ya existían (mismo código): se quedan con su información (fotos HD,
  fichas oficiales) y se marcan visibles.
- Productos nuevos: se cargan con la foto, el código y el nombre del documento. Si la
  búsqueda de ficha oficial (build_brand.py) ya está en caché, se usan ese nombre
  completo, descripción y especificaciones.
- Productos de esa marca que NO están en el documento: se ocultan.
La categoría la elige OpenAI (sin búsqueda web, en lotes) cuando la marca no tiene una fija.
Escribe docs_index.json con los productos de los documentos (lo usa sync_intrade.py).
"""
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_brand as bb  # noqa: E402

DOCS = bb.DOCS
OUT = HERE / "docs" / "output"
CACHE = HERE / "docs" / ".cache"
ENV_FILE = bb.ENV_FILE

# archivo -> (id, nombre, categoría fija o None, sitio del fabricante para build_brand)
BRANDS = {
    "AJAX": ("ajax", "Ajax", None), "Argos": ("argos", "Argos", None), "CDP": ("cdp", "CDP", "ups-y-reguladores"),
    "CDVI": ("cdvi", "CDVI", "control-de-acceso"), "Dahua": ("dahua", "Dahua", None),
    "DEXSON": ("dexson", "Dexson", "canaletas-e-instalacion"), "dlx": ("dlx", "DLX", None),
    "ELEKSTEEL": ("eleksteel", "Eleksteel", None), "Enforcer": ("enforcer", "Enforcer", None),
    "Firelite": ("fire-lite", "Fire-Lite", None), "Forza": ("forza", "Forza", "ups-y-reguladores"),
    "General Electric": ("general-electric", "General Electric", None), "Gerfor": ("gerfor", "Gerfor", None),
    "Hagroy": ("hagroy", "Hagroy", None), "IMOU": ("imou", "Imou", None), "Keri Systems": ("keri-systems", "Keri Systems", "control-de-acceso"),
    "Lantek": ("lantek", "Lantek", None), "Mercusys": ("mercusys", "Mercusys", "redes"), "MIRCOM": ("mircom", "Mircom", None),
    "Optex": ("optex", "Optex", None), "PARADOX": ("paradox", "Paradox", None), "PKCELL": ("pkcell", "PKCELL", "baterias-y-pilas"),
    "Polidlex": ("polidlex", "Polidlex", None), "Reyee": ("reyee", "Reyee", "redes"), "SABO": ("sabo", "SABO", None),
    "STI": ("sti", "STI", None), "TOLSEN_Revisar": ("tolsen", "Tolsen", None), "TP Link": ("tp-link", "TP-Link", "redes"),
    "TRENDnet": ("trendnet", "TRENDnet", "redes"), "Western Digital": ("western-digital", "Western Digital", "almacenamiento"),
    "ZKTeco": ("zkteco", "ZKTeco", "control-de-acceso"),
}

SECURITY_CATEGORIES = dict(bb.CATEGORIES)
SECURITY_CATEGORIES.update({"deteccion-de-incendio": "Detección de incendio", "baterias-y-pilas": "Baterías y pilas"})
TOLSEN_CATEGORIES = {  # las del PDF de Tolsen (grupo herramientas)
    "herramientas-de-corte": "Herramientas de corte", "herramientas-de-impacto": "Herramientas de impacto",
    "cubos-y-llaves": "Cubos y llaves", "herramientas-de-medicion": "Herramientas de medición",
    "desatornilladores-y-brocas": "Desatornilladores y brocas", "herramientas-dielectricas": "Herramientas dieléctricas",
    "herramientas-inalambricas": "Herramientas inalámbricas", "herramientas-alambricas": "Herramientas alámbricas",
    "indumentaria": "Indumentaria", "bolsas-de-herramientas-y-almacenamiento": "Bolsas de herramientas y almacenamiento",
    "otros": "Otros",
}

CLASSIFY_PROMPT = """Clasificas productos de un catálogo en categorías. Para cada producto (sku, name) elige UNA categoría de la lista (usa el slug exacto). Responde solo JSON."""


def env():
    vals = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        k, sep, v = line.partition("=")
        if sep and not line.startswith("#"):
            vals[k.strip()] = v.strip()
    return vals


def http(method, url, headers, body=None):
    req = urllib.request.Request(url, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else None


def classify(items, categories, api_key):
    """{sku: slug} en lotes de 40, sin búsqueda web."""
    out = {}
    schema = {"type": "object", "properties": {"items": {"type": "array", "items": {"type": "object", "properties": {
        "sku": {"type": "string"}, "category": {"type": "string", "enum": list(categories)}},
        "required": ["sku", "category"], "additionalProperties": False}}}, "required": ["items"], "additionalProperties": False}
    for i in range(0, len(items), 40):
        batch = [{"sku": s, "name": n} for s, n in items[i:i + 40]]
        raw = json.dumps({"categories": categories, "products": batch}, ensure_ascii=False, sort_keys=True)
        path = CACHE / f"cls-{hashlib.sha1(raw.encode()).hexdigest()[:16]}.json"
        if path.exists():
            res = json.loads(path.read_text(encoding="utf-8"))
        else:
            body = {"model": bb.MODEL, "instructions": CLASSIFY_PROMPT, "input": raw, "reasoning": {"effort": "low"},
                    "store": False, "text": {"format": {"type": "json_schema", "name": "cats", "strict": True, "schema": schema}}}
            data = http("POST", "https://api.openai.com/v1/responses",
                        {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, body)
            text = "".join(c["text"] for o in data["output"] if o["type"] == "message" for c in o["content"] if c["type"] == "output_text")
            res = json.loads(text)
            path.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
        out.update({r["sku"]: r["category"] for r in res["items"]})
    return out


def cached_lookup(brand_id, sku, raw_name):
    """Ficha oficial ya buscada por build_brand.py (no hace búsquedas nuevas)."""
    path = HERE / brand_id / ".cache" / f"web-{hashlib.sha1(f'{bb.MODEL}|{brand_id}|{sku}|{raw_name}'.encode()).hexdigest()[:16]}.json"
    if path.exists():
        info = json.loads(path.read_text(encoding="utf-8"))
        if info.get("found") and info.get("sources") and bb.agrees(raw_name, info):
            return info
    return None


def key(code):
    k = re.sub(r"[^a-z0-9]", "", (code or "").lower())
    return re.sub(r"^dhi?(?=[a-z]{2,})", "", k)


def main(dry_run):
    sys.stdout.reconfigure(encoding="utf-8")
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    e = env()
    base, skey, api_key = e["SUPABASE_URL"].rstrip("/"), e["SUPABASE_SERVICE_ROLE_KEY"], e["OPENAI_API_KEY"]
    sb = {"apikey": skey, "Authorization": f"Bearer {skey}", "Content-Type": "application/json"}
    existing, off = [], 0
    while True:  # de a 1000 (límite de Supabase)
        page = http("GET", f"{base}/rest/v1/products?select=id,reference,brand_id,specs&order=id&limit=1000&offset={off}", sb)
        existing += page
        if len(page) < 1000:
            break
        off += 1000
    # Los que creó este mismo script en una corrida anterior se rehacen (así toman las fichas
    # oficiales que build_brand.py haya encontrado después); los de otros procesos se respetan.
    prev = OUT / "catalog.json"
    mine = {p["id"] for p in json.loads(prev.read_text(encoding="utf-8"))["products"]} if prev.exists() else set()
    hide_candidates = existing
    existing = [p for p in existing if p["id"] not in mine]

    def existing_index(brand_id):
        idx = {}
        for p in existing:
            if p["brand_id"] != brand_id:
                continue
            for c in (p["reference"], (p["specs"] or {}).get("Código Intrade"), (p["specs"] or {}).get("Código Dahua CR")):
                if c:
                    idx.setdefault(key(c), p["id"])
        return idx

    new_products, brands, used_cats, doc_ids, hide_ids, summary = [], [], {}, [], [], []
    for doc_name, (bid, bname, fixed) in BRANDS.items():
        path = DOCS / f"{doc_name}.docx"
        if not path.exists():
            continue
        items = bb.read_doc(path)
        idx = existing_index(bid)
        cats = TOLSEN_CATEGORIES if bid == "tolsen" else SECURITY_CATEGORIES
        parent = "herramientas" if bid == "tolsen" else "seguridad"
        news = [(s, n, img) for s, n, img in items if key(s) not in idx]
        matched = {idx[key(s)] for s, _, _ in items if key(s) in idx}
        doc_ids += sorted(matched)
        doc_new_ids = {f"{bid}-{re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')}" for s, _, _ in news}
        hide_ids += [p["id"] for p in hide_candidates if p["brand_id"] == bid and p["id"] not in matched and p["id"] not in doc_new_ids]
        cls = {} if fixed or not news or dry_run else classify([(s, bb.clean_name(n, bname)[0]) for s, n, _ in news], cats, api_key)
        for sku, raw, blob in news:
            name, truncated = bb.clean_name(raw, bname)
            info = cached_lookup(bid, sku, raw)
            if info and info.get("name_es"):
                name = info["name_es"].strip().upper()
            cat = fixed or cls.get(sku) or ("otros" if bid == "tolsen" else "otros-seguridad")
            pid = f"{bid}-{re.sub(r'[^a-z0-9]+', '-', sku.lower()).strip('-')}"
            used_cats[cat] = (cats.get(cat) or SECURITY_CATEGORIES.get(cat, cat), parent)
            specs = {"Código Intrade": sku}
            if info:
                specs.update({s["name"]: s["value"] for s in info.get("specs", []) if s.get("name") and s.get("value")})
            if not dry_run:
                w, h = bb.to_webp(blob, OUT / "images" / f"{pid}.webp")
            else:
                w = h = 0
            new_products.append({
                "id": pid, "reference": (info or {}).get("model") or sku, "name": name, "categorySlug": cat,
                "brandId": bid, "brandName": bname,
                "description": "\n".join(f"• {f}" for f in info.get("features_es", [])) if info and info.get("features_es") else None,
                "images": [{"url": f"images/{pid}.webp", "alt": f"{name.capitalize()} {bname}", "width": w, "height": h, "needsReview": False}],
                "specs": specs, "isNew": False, "discontinued": False,
                "sourceUrl": (info.get("sources") or [None])[0] if info else None, "officialName": (info or {}).get("model"),
                "source": {"page": None},
            })
            doc_ids.append(pid)
        brands.append({"id": bid, "name": bname, "logoUrl": None})
        summary.append(f"{bname:18s} doc {len(items):4d} | ya existían {len(matched):4d} | nuevos/actualizados {len(news):4d} | con ficha {sum(1 for s, n, _ in news if cached_lookup(bid, s, n)):4d}")
    print("\n".join(summary))
    print(f"TOTAL en documentos: {len(doc_ids)} | nuevos a cargar: {len(new_products)} | a ocultar: {len(hide_ids)}")
    if dry_run:
        return
    pos = {**{s: i for i, s in enumerate(TOLSEN_CATEGORIES)}, **{s: 100 + i for i, s in enumerate(SECURITY_CATEGORIES)}}
    catalog = {"source": "Info_Completa/*.docx", "brands": [], "products": new_products,
               "categories": [{"id": s, "slug": s, "name": n, "parentSlug": p, "position": pos.get(s, 199)} for s, (n, p) in used_cats.items()]}
    # No pisar el logo ni el nombre de marcas que ya existen.
    have_brands = {b["id"] for b in http("GET", f"{base}/rest/v1/brands?select=id", sb)}
    catalog["brands"] = [b for b in brands if b["id"] not in have_brands]
    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (HERE / "docs_index.json").write_text(json.dumps(sorted(set(doc_ids)), indent=0), encoding="utf-8")
    (HERE / "docs_hidden.json").write_text(json.dumps(sorted(set(hide_ids)), indent=0), encoding="utf-8")
    print("Listo: backend/catalog/marcas/docs/output/catalog.json")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
