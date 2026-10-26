"""Arma el catálogo Dahua: PDF de Dahua Costa Rica + páginas oficiales + verificación con Intrade.

Uso:
    python -I backend/catalog/dahua/extract_dahua_pdf.py "backend/catalog/nuevos/Catalogo_Dahua_v2-9.pdf"
    python -I backend/catalog/dahua/fetch_dahua.py          # opcional, lento (Crawl-delay 100 s)
    python -I backend/catalog/dahua/build_dahua.py
    python -I backend/catalog/load_catalog.py backend/catalog/dahua/output

Fuentes, en orden de prioridad:
1. Página oficial de dahuasecurity.com (si se descargó): nombre, puntos clave, ficha y foto.
2. Catálogo PDF de Dahua Costa Rica: código, descripción en español y foto.
La lista de modelos de intradeabc.com (solo los códigos, de su índice público) se usa
para verificar que el modelo existe en el mercado de Costa Rica. No se usa su contenido.

OpenAI estructura cada ficha del PDF (modelo, nombre limpio, características del texto)
y traduce las páginas oficiales. No agrega datos. Salida en output/ + report.md.
"""
import hashlib
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
OUT = HERE / "output"
CACHE = HERE / ".cache"
ENV_FILE = HERE.parent.parent / ".env.supabase"
MODEL = "gpt-5.4-mini"
UA = "Mozilla/5.0 (JC Security catalog sync)"
BRAND = {"id": "dahua", "name": "Dahua",
         "logoUrl": "https://xehegspjlbpkvhsgcdqj.supabase.co/storage/v1/object/public/catalogo/brands/dahua.svg"}
PARENT = "seguridad"
CATEGORIES = [  # slug, nombre, posición (las de Tolsen van de 0 a 10)
    ("camaras-ip", "Cámaras IP"),
    ("camaras-hdcvi", "Cámaras HDCVI (analógicas)"),
    ("grabadores", "Grabadores (NVR / XVR)"),
    ("kits-cctv", "Kits de videovigilancia"),
    ("almacenamiento", "Discos duros y memorias"),
    ("accesorios-seguridad", "Accesorios para CCTV"),
    ("solucion-movil", "Videovigilancia móvil"),
    ("videoporteros", "Videoporteros"),
    ("control-de-acceso", "Control de acceso y asistencia"),
    ("alarmas", "Alarmas"),
    ("redes", "Switches y redes"),
    ("monitores", "Monitores"),
    ("otros-seguridad", "Otros de seguridad"),
]

PDF_PROMPT = """Estructuras fichas de un catálogo oficial de Dahua Costa Rica (texto en español, a veces con palabras partidas por guiones de fin de línea).

Para cada producto recibes "code" (código del catálogo) y "text" (descripción). Devuelve por producto:
- model: el modelo oficial de Dahua tal como aparece en el texto (ej. "HAC-HDW1200TN-Z", "DH-PFS3006-4ET-36", "IPC-HFW2441S-S"). Si el texto no trae un modelo, devuelve el código. Une los modelos partidos por un guion de fin de línea solo si es evidente.
- name_es: nombre del producto en español, en MAYÚSCULAS, sin el modelo, sin la palabra DAHUA, con las palabras partidas corregidas ("ANTIVANDA-LICA" -> "ANTIVANDÁLICA", "ME-TAL" -> "METAL"). Conserva todos los datos técnicos del texto. No agregues nada.
- specs: características que el texto dice explícitamente (Resolución, Lente, Alcance IR, Protección, Canales, Puertos, PoE, Capacidad, Discos, Compresión, Tamaño de pantalla…), nombre en español y valor tal cual. Nada que no esté en el texto.
- consistent: false si el código y el modelo parecen productos distintos (por ejemplo, otra cantidad de puertos o canales, u otro número de modelo); true si concuerdan.
- note: si consistent es false, explica la diferencia en una frase corta en español; si no, cadena vacía."""

PDF_SCHEMA = {"type": "object", "properties": {"items": {"type": "array", "items": {
    "type": "object", "properties": {
        "code": {"type": "string"}, "model": {"type": "string"}, "name_es": {"type": "string"},
        "specs": {"type": "array", "items": {"type": "object", "properties": {
            "name": {"type": "string"}, "value": {"type": "string"}}, "required": ["name", "value"], "additionalProperties": False}},
        "consistent": {"type": "boolean"}, "note": {"type": "string"}},
    "required": ["code", "model", "name_es", "specs", "consistent", "note"], "additionalProperties": False}}},
    "required": ["items"], "additionalProperties": False}

WEB_PROMPT = """Preparas fichas en español para un distribuidor autorizado de Dahua en Costa Rica, con la información OFICIAL de Dahua (en inglés).
Devuelve:
- name_es: nombre comercial corto en español, en MAYÚSCULAS, con los datos principales del nombre oficial (tipo de producto, resolución, lente…), sin el modelo ni la palabra DAHUA. No inventes.
- features_es: los puntos clave traducidos fielmente, uno por elemento; no agregues ni resumas.
- specs: entre 6 y 14 características de la tabla oficial, las más útiles para un comprador (resolución, sensor, lente, alcance IR, canales, compresión, almacenamiento, audio, alimentación, PoE, protección IP/IK…). Nombre en español; valor tal cual (traduce solo palabras sueltas como "Yes", "Auto", "Indoor"). No inventes."""

WEB_SCHEMA = {"type": "object", "properties": {
    "name_es": {"type": "string"},
    "features_es": {"type": "array", "items": {"type": "string"}},
    "specs": {"type": "array", "items": {"type": "object", "properties": {
        "name": {"type": "string"}, "value": {"type": "string"}}, "required": ["name", "value"], "additionalProperties": False}}},
    "required": ["name_es", "features_es", "specs"], "additionalProperties": False}


def key(code):
    k = re.sub(r"[^a-z0-9]", "", (code or "").lower())
    return re.sub(r"^dhi?(?=(ipc|hac|xvr|nvr|pfs|vto|vth|asi|sd|pfm|pfb|pfa|hd|itc|its|nkb|asc|lm|tfc|hdd))", "", k)


# Fotos del PDF revisadas a mano que son de otro producto (revisión 2026-10-26).
WRONG_PHOTO = {"DHI-TF-C100/64GB": "muestra la tarjeta de 256GB"}

# Productos del catálogo de Dahua CR que son de otra marca (discos duros).
OTHER_BRANDS = [
    (r"^WD", {"id": "western-digital", "name": "Western Digital"}),
    (r"^ST\d", {"id": "seagate", "name": "Seagate"}),
    (r"^MQ\d", {"id": "toshiba", "name": "Toshiba"}),
]


def clean_model(model):
    """Arregla modelos que el PDF partió mal al cortar la línea."""
    m = model.upper().replace("--", "-")
    m = re.sub(r"^DHX-VR", "DH-XVR", m)
    m = re.sub(r"^DH(XVR|IPC|HAC)", r"DH-\1", m)
    m = re.sub(r"^DHI(NVR|IPC|ITC)", r"DHI-\1", m)
    m = re.sub(r"\b(HAC|IPC)-HD-(W|BW|FW)", r"\1-HD\2", m)
    return m


URL_CATEGORY = [  # sección de dahuasecurity.com -> categoría del sitio
    (r"alarm", "alarmas"),
    (r"video-intercom|/vto|/vth|/vtm", "videoporteros"),
    (r"access-control|time-attendance", "control-de-acceso"),
    (r"network-recorder|/nvr|/xvr|recorders", "grabadores"),
    (r"hdcvi-camera", "camaras-hdcvi"),
    (r"camera-accessor|/accessories|mount|tester|keyboard", "accesorios-seguridad"),
    (r"transmission|switch", "redes"),
    (r"monitor|display", "monitores"),
    (r"network-camera|wireless-products|4g-camera|wi-fi|ptz|camera", "camaras-ip"),
]


def category_from_url(url):
    path = url.lower()
    return next((c for pat, c in URL_CATEGORY if re.search(pat, path)), "otros-seguridad")


def number_conflict(code, model):
    """El código del PDF abrevia el modelo (HACHDBW2241RZ = HAC-HDBW2241RN-Z): solo es un
    conflicto si los números no cuadran (PFS3016-16GTM vs PFS3008-8GT-L, XVR…-I2 vs -I3)."""
    code_k, model_k = re.sub(r"[^a-z0-9]", "", code.lower()), re.sub(r"[^a-z0-9]", "", model.lower())
    main_code = re.findall(r"\d{3,}", code_k)[:1]
    main_model = re.findall(r"\d{3,}", model_k)[:1]
    if main_code and main_model and main_code[0] != main_model[0] and not main_code[0].startswith(main_model[0]):
        return f"número de modelo distinto: {main_code[0]} en el código, {main_model[0]} en la descripción"
    gen_code = re.findall(r"i(\d)$", code_k)
    gen_model = re.findall(r"i(\d)(?:t|d)?$", model_k)
    if gen_code and gen_model and gen_code != gen_model:
        return f"versión distinta: I{gen_code[0]} en el código, I{gen_model[0]} en la descripción"
    return None


def openai_key():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("Falta OPENAI_API_KEY en backend/.env.supabase")


def ask(prompt, schema, payload, api_key):
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    path = CACHE / f"ai-{hashlib.sha1((MODEL + prompt + raw).encode()).hexdigest()[:16]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    body = {"model": MODEL, "instructions": prompt, "input": raw, "reasoning": {"effort": "low"}, "store": False,
            "text": {"format": {"type": "json_schema", "name": "ficha", "strict": True, "schema": schema}}}
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.load(resp)
    out = "".join(c["text"] for i in data["output"] if i["type"] == "message" for c in i["content"] if c["type"] == "output_text")
    result = json.loads(out)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def official_pages():
    """Modelo oficial -> (url, datos) de las páginas de Dahua ya descargadas."""
    sys.path.insert(0, str(HERE))
    import fetch_dahua
    from parse_dahua_page import parse
    pages = json.loads((HERE / "modelos_intrade.json").read_text(encoding="utf-8"))["pages"]
    found = {}
    for url in pages.values():
        path = fetch_dahua.cache_path(url)
        if path.exists():
            data = parse(path.read_text(encoding="utf-8"))
            if data:
                found[key(data["model"])] = (url, data)
    return found


def intrade_keys():
    """Claves de modelo de la lista de intradeabc.com (solo el índice público de productos)."""
    data = json.loads((HERE / "modelos_intrade.json").read_text(encoding="utf-8"))
    models = list(data["pages"]) + data["sin_pagina_oficial"]
    slugs = data["sin_modelo_en_intrade"]
    return {key(m) for m in models}, [re.sub(r"[^a-z0-9]", "", s) for s in slugs]


def fetch_bytes(url):
    cached = CACHE / ("img-" + hashlib.sha1(url.encode()).hexdigest()[:16] + ".bin")
    if not cached.exists():
        time.sleep(1)
        req = urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%#+,;@"), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as resp:
            cached.write_bytes(resp.read())
    return cached.read_bytes()


def clean_name(name):
    """Nombre en MAYÚSCULAS y solo con letras latinas (el modelo a veces mete otro alfabeto)."""
    fixes = {"ენერგ": "ENERG"}  # georgiano que el modelo metió en "ENERGÍA"
    for bad, good in fixes.items():
        name = name.replace(bad, good)
    name = name.upper()
    odd = [c for c in name if c.isalpha() and not ("A" <= c <= "Z" or c in "ÁÉÍÓÚÑÜ")]
    if odd:
        raise ValueError(f"Nombre con caracteres raros: {name}")
    return name


def first_image(urls, out_path):
    """Primera foto oficial que se pueda descargar (algunas devuelven 403)."""
    for url in urls:
        try:
            return to_webp(fetch_bytes(url), out_path)
        except (urllib.error.URLError, OSError):
            continue
    return None


def to_webp(data, out_path, min_side=0):
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    img = Image.alpha_composite(Image.new("RGBA", img.size, "white"), img).convert("RGB")
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.05)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    # Las fotos del PDF son chicas (~180 px): se amplían con LANCZOS hasta un tamaño parejo con las demás.
    if min_side and max(img.size) < min_side:
        scale = min_side / max(img.size)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    img.thumbnail((800, 800))
    img.save(out_path, "WEBP", quality=88, method=6)
    return img.width, img.height


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    api_key = openai_key()
    pdf = json.loads((HERE / "pdf_products.json").read_text(encoding="utf-8"))
    official = official_pages()
    intrade, intrade_slugs = intrade_keys()

    # 1) Estructurar las fichas del PDF en lotes de 12.
    structured = {}
    for i in range(0, len(pdf), 12):
        batch = [{"code": p["code"], "text": p["description_pdf"]} for p in pdf[i:i + 12]]
        for item in ask(PDF_PROMPT, PDF_SCHEMA, {"products": batch}, api_key)["items"]:
            structured[item["code"]] = item
        print(f"fichas PDF {min(i + 12, len(pdf))}/{len(pdf)}", flush=True)

    products, report, seen, seen_codes = [], {"inconsistentes": [], "duplicados": [], "sin_foto": [], "no_en_intrade": []}, {}, set()
    for p in pdf:
        s = structured.get(p["code"])
        if not s:
            continue
        model = clean_model(re.sub(r"\s+\d+(\.\d+)?\s*MM$", "", s["model"].strip(), flags=re.I))  # "… 2.8MM" es el lente
        k = key(model)
        if p["code"] in seen_codes:  # la misma tarjeta leída dos veces (el PDF dibuja dos fondos)
            continue
        seen_codes.add(p["code"])
        if k in seen:
            report["duplicados"].append(f"{p['code']}: su descripción es la del modelo {model}, que ya es el producto "
                                        f"{seen[k]}; parece copiada de otra tarjeta, no se carga (pág. {p['page']})")
            continue
        seen[k] = p["code"]
        verified = k in intrade or key(p["code"]) in intrade or any(k and k in sl for sl in intrade_slugs)
        if not verified:
            report["no_en_intrade"].append(f"{model} — {s['name_es'][:60]} (pág. {p['page']})")
        conflict = number_conflict(p["code"], model)
        if conflict:
            report["inconsistentes"].append(f"{p['code']} / {model} — {conflict} (pág. {p['page']})")
        page = official.get(k)
        fname = f"dahua-{k}.webp"
        description, specs, source_url, official_name, image = None, {}, None, None, None
        if page:
            url, data = page
            web = ask(WEB_PROMPT, WEB_SCHEMA, {"model": data["model"], "name": data["name"], "features": data["features"],
                                                "specs": data["specs"]}, api_key)
            description = "\n".join(f"• {f}" for f in web["features_es"]) or None
            specs = {x["name"]: x["value"] for x in web["specs"] if x["value"]}
            source_url, official_name = url, f"{data['model']} {data['name']}"
            size = first_image(data["images"], OUT / "images" / fname)
            if size:
                w, h = size
                image = {"width": w, "height": h, "needsReview": False, "officialImage": True}
        if not specs:
            specs = {x["name"]: x["value"] for x in s["specs"] if x["value"]}
        if not image and p["image"] and p["code"] in WRONG_PHOTO:
            report["sin_foto"].append(f"{model}: la foto del PDF {WRONG_PHOTO[p['code']]} (pág. {p['page']})")
        elif not image and p["image"]:
            w, h = to_webp((HERE / p["image"]).read_bytes(), OUT / "images" / fname, min_side=480)
            image = {"width": w, "height": h, "needsReview": False, "officialImage": False}
        if not image and p["code"] not in WRONG_PHOTO:
            report["sin_foto"].append(f"{model} (pág. {p['page']})")
        brand = next((b for pat, b in OTHER_BRANDS if re.search(pat, model)), BRAND)
        specs = {"Código Dahua CR": p["code"], **specs}
        products.append({
            "id": f"dahua-{k}", "reference": model, "name": clean_name(s["name_es"]), "categorySlug": p["category"],
            "brandId": brand["id"], "brandName": brand["name"], "description": description,
            "images": [{"url": f"images/{fname}", "alt": f"{s['name_es'].capitalize()} {brand['name']} {model}", **image}] if image else [],
            "specs": specs, "isNew": False, "discontinued": False, "sourceUrl": source_url, "officialName": official_name,
            "verifiedIntrade": verified, "source": {"page": p["page"]},
        })
    # Modelos con página oficial (vienen de la lista de Intrade) que no estaban en el PDF.
    present = {key(p["reference"]) for p in products}
    for k, (url, data) in official.items():
        if k in present or not data["images"]:
            continue
        web = ask(WEB_PROMPT, WEB_SCHEMA, {"model": data["model"], "name": data["name"], "features": data["features"],
                                            "specs": data["specs"]}, api_key)
        fname = f"dahua-{k}.webp"
        size = first_image(data["images"], OUT / "images" / fname)
        if not size:
            report["sin_foto"].append(f"{data['model']}: la web de Dahua no deja descargar sus fotos (no se carga)")
            continue
        w, h = size
        products.append({
            "id": f"dahua-{k}", "reference": data["model"], "name": clean_name(web["name_es"]), "categorySlug": category_from_url(url),
            "brandId": BRAND["id"], "brandName": BRAND["name"],
            "description": "\n".join(f"• {f}" for f in web["features_es"]) or None,
            "images": [{"url": f"images/{fname}", "alt": f"{web['name_es'].capitalize()} Dahua {data['model']}",
                        "width": w, "height": h, "needsReview": False, "officialImage": True}],
            "specs": {x["name"]: x["value"] for x in web["specs"] if x["value"]}, "isNew": False, "discontinued": False,
            "sourceUrl": url, "officialName": f"{data['model']} {data['name']}", "verifiedIntrade": True,
            "source": {"page": None},
        })
        print(f"oficial: {data['model']} -> {web['name_es']} [{category_from_url(url)}]")
    used = {p["categorySlug"] for p in products}
    brands = [BRAND] + [b for _, b in OTHER_BRANDS if any(p["brandId"] == b["id"] for p in products)]
    catalog = {"source": "Catalogo_Dahua_v2-9.pdf + dahuasecurity.com", "brands": brands,
               "categories": [{"id": s, "slug": s, "name": n, "parentSlug": PARENT, "position": 100 + i}
                              for i, (s, n) in enumerate(CATEGORIES) if s in used],
               "products": products}
    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    titles = {"inconsistentes": "Código y modelo no concuerdan en el PDF (revisar)",
              "duplicados": "Descripción copiada de otro producto (no se cargan)",
              "sin_foto": "Sin foto", "no_en_intrade": "No aparecen en la lista de Intrade (se cargaron igual: vienen del catálogo oficial)"}
    lines = ["# Catálogo Dahua: revisión", "",
             f"{len(products)} productos cargados; {sum(1 for p in products if p['sourceUrl'])} con ficha oficial de dahuasecurity.com;"
             f" {sum(1 for p in products if p['verifiedIntrade'])} verificados en la lista de Intrade.", ""]
    for k2, t in titles.items():
        lines += [f"## {t} ({len(report[k2])})", ""] + [f"- {x}" for x in report[k2]] + [""]
    (OUT / "report.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines[:3]))


if __name__ == "__main__":
    main()
