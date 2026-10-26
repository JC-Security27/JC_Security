"""Catálogo Altronix: los modelos que Intrade tiene en stock, con datos de altronix.com.

Uso:
    python -I backend/catalog/altronix/build_altronix.py
    python -I backend/catalog/load_catalog.py backend/catalog/altronix/output
    python -I backend/catalog/sync_intrade.py

La lista de modelos sale de backend/catalog/nuevos/ALTRONIX_Intrade.docx (solo los
códigos; las fotos de ese documento son de Intrade y no se usan). Nombre, descripción,
ficha técnica y foto salen de la página oficial https://www.altronix.com/products/<MODELO>
(robots.txt de Altronix permite el acceso). OpenAI traduce sin agregar datos.
"""
import hashlib
import html
import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

import docx
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
OUT = HERE / "output"
CACHE = HERE / ".cache"
DOCX = HERE.parent / "nuevos" / "ALTRONIX_Intrade.docx"
ENV_FILE = HERE.parent.parent / ".env.supabase"
SITE = "https://www.altronix.com"
MODEL = "gpt-5.4-mini"
UA = "Mozilla/5.0 (JC Security catalog sync)"
BRAND = {"id": "altronix", "name": "Altronix",
         "logoUrl": "https://xehegspjlbpkvhsgcdqj.supabase.co/storage/v1/object/public/catalogo/brands/altronix.png"}
CATEGORY = {"id": "fuentes-de-poder", "slug": "fuentes-de-poder", "name": "Fuentes de poder",
            "parentSlug": "seguridad", "position": 113}

PROMPT = """Preparas fichas en español para un distribuidor de Altronix en Costa Rica, con la información OFICIAL de altronix.com (en inglés).
Devuelve:
- name_es: nombre comercial corto en español, en MAYÚSCULAS, que traduzca fielmente el título oficial (tipo de producto, salidas, voltaje, corriente…), sin el modelo ni la palabra ALTRONIX.
- features_es: la descripción y las características principales traducidas fielmente, una por elemento (máximo 10). No agregues nada.
- specs: entre 5 y 12 datos técnicos de la ficha (entrada, salida, corriente, carga de batería, indicadores, temperatura de operación, dimensiones, peso…), nombre en español y valor traducido al español conservando exactamente números y unidades (ej. \"12VDC o 24VDC seleccionable\", \"0 °C a 49 °C\"). No inventes."""

SCHEMA = {"type": "object", "properties": {
    "name_es": {"type": "string"},
    "features_es": {"type": "array", "items": {"type": "string"}},
    "specs": {"type": "array", "items": {"type": "object", "properties": {
        "name": {"type": "string"}, "value": {"type": "string"}}, "required": ["name", "value"], "additionalProperties": False}}},
    "required": ["name_es", "features_es", "specs"], "additionalProperties": False}


def models_from_docx():
    paras = [p.text.strip() for p in docx.Document(DOCX).paragraphs if p.text.strip()]
    return [p for p in paras if re.fullmatch(r"[A-Z0-9]{3,}", p)]


def fetch(url, binary=False):
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + (".bin" if binary else ".html"))
    if not path.exists():
        time.sleep(2)
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as resp:
            path.write_bytes(resp.read())
    data = path.read_bytes()
    return data if binary else data.decode("utf-8", "replace")


def parse(page, model):
    body = re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S)
    txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", body)))
    m = re.search(rf"Go {re.escape(model)} ", txt, re.I)  # Altronix escribe "FireSwitch108"
    if not m:
        return None
    start = m.start()
    block = txt[start + 3: txt.find("Data Sheet", start)]
    img = re.search(rf'["\'](/images/products/{model.lower()}/[^"\']+\.(?:jpg|png))["\']', page, re.I)
    pdf = re.search(r'href="([^"]+/data_sheets?/[^"]+\.pdf)"', page, re.I)
    return {"text": block.strip(), "image": SITE + img.group(1) if img else None,
            "datasheet": (pdf.group(1) if pdf and pdf.group(1).startswith("http") else SITE + pdf.group(1)) if pdf else None}


def openai_key():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("Falta OPENAI_API_KEY en backend/.env.supabase")


def ask(payload, api_key):
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    path = CACHE / f"ai-{hashlib.sha1((MODEL + PROMPT + raw).encode()).hexdigest()[:16]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    body = {"model": MODEL, "instructions": PROMPT, "input": raw, "reasoning": {"effort": "low"}, "store": False,
            "text": {"format": {"type": "json_schema", "name": "ficha", "strict": True, "schema": SCHEMA}}}
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.load(resp)
    out = "".join(c["text"] for i in data["output"] if i["type"] == "message" for c in i["content"] if c["type"] == "output_text")
    result = json.loads(out)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def to_webp(data, out_path):
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    img = Image.alpha_composite(Image.new("RGBA", img.size, "white"), img).convert("RGB")
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.05)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    img.thumbnail((800, 800))
    img.save(out_path, "WEBP", quality=88, method=6)
    return img.width, img.height


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    api_key = openai_key()
    products, missing = [], []
    for model in models_from_docx():
        url = f"{SITE}/products/{model}"
        data = parse(fetch(url), model)
        if not data or not data["image"]:
            missing.append(model)
            print(f"{model}: sin página o sin foto en altronix.com")
            continue
        es = ask({"model": model, "official": data["text"]}, api_key)
        fname = f"altronix-{model.lower()}.webp"
        w, h = to_webp(fetch(data["image"], binary=True), OUT / "images" / fname)
        name = es["name_es"].upper()
        products.append({
            "id": f"altronix-{model.lower()}", "reference": model, "name": name, "categorySlug": CATEGORY["slug"],
            "brandId": BRAND["id"], "brandName": BRAND["name"],
            "description": "\n".join(f"• {f}" for f in es["features_es"]) or None,
            "images": [{"url": f"images/{fname}", "alt": f"{name.capitalize()} Altronix {model}", "width": w, "height": h,
                        "needsReview": False}],
            "specs": {s["name"]: s["value"] for s in es["specs"] if s["value"]}, "isNew": False, "discontinued": False,
            "sourceUrl": url, "officialName": data["text"].split(".")[0][:200], "source": {"page": None},
        })
        print(f"{model}: {name}")
    catalog = {"source": "altronix.com + ALTRONIX_Intrade.docx", "brands": [BRAND], "categories": [CATEGORY],
               "products": products}
    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{len(products)} productos Altronix; sin datos: {missing or 'ninguno'}")


if __name__ == "__main__":
    main()
