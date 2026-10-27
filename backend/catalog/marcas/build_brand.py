"""Carga una marca desde los archivos del usuario (backend/catalog/Info_Completa/<Marca>.docx).

Uso:
    python -I backend/catalog/marcas/build_brand.py CDP
    python -I backend/catalog/load_catalog.py backend/catalog/marcas/cdp/output
    python -I backend/catalog/sync_intrade.py

Cada documento trae, por producto: foto, SKU (código de Intrade) y nombre (a veces
cortado con "..."). El usuario los preparó con lo que Intrade tiene en stock.
Para cada SKU:
1. Busca en internet la ficha OFICIAL (OpenAI con búsqueda web, preferiendo el sitio
   del fabricante) y devuelve modelo, nombre completo, características y
   especificaciones en español, con sus fuentes. Si no hay una fuente que mencione el
   modelo exacto, no se inventa: queda con el nombre del documento y se reporta.
2. Elige la categoría del sitio entre las de CATEGORIES.
3. Usa la foto del documento (300 px), con fondo blanco y recorte parejo.
Respuestas guardadas en <marca>/.cache para no repetir búsquedas (cuestan dinero).
Salida: <marca>/output/catalog.json, images/ y report.md.
"""
import concurrent.futures as cf
import hashlib
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

import docx
from docx.oxml.ns import qn
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
DOCS = HERE.parent / "Info_Completa"
ENV_FILE = HERE.parent.parent / ".env.supabase"
MODEL = "gpt-5.4-mini"
MAX_SEARCHES = 4
WORKERS = 4

BRANDS = {  # nombre del archivo -> marca
    "AJAX": {"id": "ajax", "name": "Ajax", "site": "ajax.systems"},
    "CDP": {"id": "cdp", "name": "CDP", "site": "cdpenergy.com", "category": "ups-y-reguladores"},
    "CDVI": {"id": "cdvi", "name": "CDVI", "site": "cdvi.com", "category": "control-de-acceso"},
    "Dahua": {"id": "dahua", "name": "Dahua", "site": "dahuasecurity.com"},
    "DEXSON": {"id": "dexson", "name": "Dexson", "site": "dexson.com", "category": "canaletas-e-instalacion"},
    "dlx": {"id": "dlx", "name": "DLX", "site": ""},
}

# Categorías del grupo "seguridad" (las existentes y las nuevas para estas marcas).
CATEGORIES = {
    "camaras-ip": "Cámaras IP", "camaras-hdcvi": "Cámaras HDCVI (analógicas)", "grabadores": "Grabadores (NVR / XVR)",
    "kits-cctv": "Kits de videovigilancia", "almacenamiento": "Discos duros y memorias",
    "accesorios-seguridad": "Accesorios para CCTV", "solucion-movil": "Videovigilancia móvil",
    "videoporteros": "Videoporteros", "control-de-acceso": "Control de acceso y asistencia", "alarmas": "Alarmas",
    "redes": "Switches y redes", "monitores": "Monitores", "fuentes-de-poder": "Fuentes de poder",
    "ups-y-reguladores": "UPS y reguladores de voltaje", "gabinetes-y-cableado": "Gabinetes, racks y cableado",
    "canaletas-e-instalacion": "Canaletas y accesorios de instalación",
    "hogar-inteligente": "Automatización y hogar inteligente", "otros-seguridad": "Otros de seguridad",
}
CATEGORY_POSITION = {s: 100 + i for i, s in enumerate(CATEGORIES)}

PROMPT = """Preparas fichas de producto en español para un distribuidor de seguridad electrónica en Costa Rica.
Recibes marca, código (SKU) y un nombre en español que puede venir cortado con "...".

1. Busca en internet la ficha OFICIAL de ese producto exacto (prefiere el sitio del fabricante: {site}; si no, catálogos o fichas técnicas del fabricante).
2. Responde SOLO con JSON:
{{"found": bool, "model": str, "name_es": str, "category": str, "features_es": [str], "specs": [{{"name": str, "value": str}}], "sources": [str]}}
- found: true solo si encontraste una fuente que menciona ESE modelo/código exacto.
- model: el modelo oficial del fabricante (ej. "DH-IPC-HFW2449S-S-IL", "RU-AVR604"); si no lo encuentras, el SKU.
- name_es: nombre comercial completo en español, en MAYÚSCULAS, sin la marca ni el modelo (completa el nombre cortado con datos de la ficha).
- category: una de {categories}.
- features_es: características principales traducidas fielmente (máx. 8). No inventes.
- specs: 5 a 12 especificaciones de la ficha (nombre en español, valor con sus unidades). No inventes.
- sources: las URL que usaste.
Si found es false, deja features_es y specs vacíos y arma name_es solo con el nombre recibido (sin inventar)."""


def openai_key():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("Falta OPENAI_API_KEY en backend/.env.supabase")


def read_doc(path):
    """[(sku, nombre, bytes de la foto)] en el orden del documento: foto, SKU, nombre, precio."""
    d = docx.Document(path)
    blobs = {rid: rel.target_part.blob for rid, rel in d.part.rels.items() if "image" in rel.reltype}
    items, image, texts = [], None, []
    for p in d.element.body.iter(qn("w:p")):
        for blip in p.iter(qn("a:blip")):
            if image is not None and texts:
                items.append((image, texts))
            image, texts = blobs.get(blip.get(qn("r:embed"))), []
        t = "".join(x.text or "" for x in p.iter(qn("w:t"))).strip()
        if t and image is not None:
            texts.append(t)
    if image is not None and texts:
        items.append((image, texts))
    out, seen = [], set()
    for image, texts in items:
        texts = [t for t in texts if "Añadir al carrito" not in t and not t.startswith("₡")]
        if len(texts) < 2 or texts[0] in seen:
            continue
        seen.add(texts[0])
        sku = re.sub(r"^[^:]{2,25}:\s*", "", texts[0]).strip()  # "Argos: 40043" -> "40043" (título del documento)
        out.append((sku, texts[1], image))
    return out


def clean_name(name, brand):
    """Nombre del documento: sin "..." final ni la marca, cortado en la última coma completa."""
    truncated = name.rstrip().endswith(("...", "…"))
    name = re.sub(r"[.…]+$", "", name).strip()
    if truncated and "," in name:
        name = name.rsplit(",", 1)[0]
    name = re.sub(rf",?\s*{re.escape(brand)}\s*,?", ",", name, flags=re.I).strip(" ,")
    return re.sub(r"\s*,\s*", ", ", name).upper(), truncated


def lookup(brand, sku, name, api_key, cache):
    path = cache / f"web-{hashlib.sha1(f'{MODEL}|{brand["id"]}|{sku}|{name}'.encode()).hexdigest()[:16]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    body = {"model": MODEL, "tools": [{"type": "web_search"}], "max_tool_calls": MAX_SEARCHES,
            "reasoning": {"effort": "low"}, "store": False,
            "instructions": PROMPT.format(site=brand["site"] or "el fabricante", categories=", ".join(CATEGORIES)),
            "input": f"Marca: {brand['name']}. SKU: {sku}. Nombre: {name}"}
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.load(resp)
    text = "".join(c.get("text", "") for o in data["output"] if o["type"] == "message" for c in o["content"])
    m = re.search(r"\{.*\}", text, re.S)
    result = json.loads(m.group(0)) if m else {"found": False}
    result.setdefault("found", False)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def numbers(text):
    """Datos numéricos de un texto: 1500va, 900w, 175, 2.8mm… (para comparar fichas)."""
    t = (text or "").lower().replace(",", ".")
    return {m for m in re.findall(r"\d+(?:\.\d+)?(?:\s?(?:va|w|kw|mp|mm|m|tb|gb|v|a|hz|db|pcs|und|u|ch|p))?", t)
            if len(m.replace(" ", "")) >= 2}


def agrees(doc_name, info):
    """Los datos del nombre del documento tienen que estar en la ficha encontrada.
    Evita aceptar la ficha de otro modelo cuando el código de Intrade es interno."""
    doc = {re.sub(r"\s", "", n) for n in numbers(doc_name)}
    if not doc:
        return True
    official = " ".join([info.get("model", ""), info.get("name_es", ""), " ".join(info.get("features_es", []))] +
                        [f"{s.get('name')} {s.get('value')}" for s in info.get("specs", [])])
    off = re.sub(r"\s", "", official.lower().replace(",", "."))
    hits = sum(1 for n in doc if n in off or re.sub(r"[a-z]+$", "", n) in off)
    return hits / len(doc) >= 0.7


def to_webp(blob, out_path):
    img = Image.open(io.BytesIO(blob)).convert("RGBA")
    img = Image.alpha_composite(Image.new("RGBA", img.size, "white"), img).convert("RGB")
    box = ImageChops.difference(img, Image.new("RGB", img.size, "white")).point(lambda v: 255 if v > 18 else 0).getbbox()
    if box:
        pad = round(max(img.size) * 0.05)
        img = img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, img.width), min(box[3] + pad, img.height)))
    if max(img.size) < 480:  # fotos de 300 px: se amplían con buen filtro para que no se vean más chicas
        s = 480 / max(img.size)
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    img.save(out_path, "WEBP", quality=88, method=6)
    return img.width, img.height


def main(doc_name):
    sys.stdout.reconfigure(encoding="utf-8")
    brand = BRANDS[doc_name]
    base = HERE / brand["id"]
    out, cache = base / "output", base / ".cache"
    (out / "images").mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    api_key = openai_key()
    items = read_doc(DOCS / f"{doc_name}.docx")
    print(f"{brand['name']}: {len(items)} productos en el documento", flush=True)

    def work(item):
        sku, raw_name, blob = item
        name, truncated = clean_name(raw_name, brand["name"])
        info = lookup(brand, sku, raw_name, api_key, cache)
        return sku, name, truncated, blob, info

    raw_names = {sku: raw for sku, raw, _ in items}
    products, report = [], {"sin_ficha": [], "nombre_cortado_sin_ficha": [], "no_concuerda": []}
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        for n, (sku, name, truncated, blob, info) in enumerate(pool.map(work, items), 1):
            found = bool(info.get("found")) and bool(info.get("sources"))
            if found and not agrees(raw_names[sku], info):
                report["no_concuerda"].append(f"{sku} — {name}: la ficha encontrada ({info.get('model')}) no tiene los mismos datos")
                found = False
            final_name = (info.get("name_es") or "").strip().upper() if found and info.get("name_es") else name
            # Marcas de un solo rubro tienen categoría fija; las demás, la que eligió la búsqueda.
            category = brand.get("category") or (info.get("category") if info.get("category") in CATEGORIES else "otros-seguridad")
            model = (info.get("model") or "").strip() if found else ""
            reference = model if model and len(model) >= 3 else sku
            pid = f"{brand['id']}-{re.sub(r'[^a-z0-9]+', '-', sku.lower()).strip('-')}"
            fname = f"{pid}.webp"
            w, h = to_webp(blob, out / "images" / fname)
            specs = {"Código Intrade": sku}
            if found:
                specs.update({s["name"]: s["value"] for s in info.get("specs", []) if s.get("name") and s.get("value")})
            else:
                report["nombre_cortado_sin_ficha" if truncated else "sin_ficha"].append(f"{sku} — {name}")
            products.append({
                "id": pid, "reference": reference, "name": final_name, "categorySlug": category,
                "brandId": brand["id"], "brandName": brand["name"],
                "description": "\n".join(f"• {f}" for f in info.get("features_es", [])) if found and info.get("features_es") else None,
                "images": [{"url": f"images/{fname}", "alt": f"{final_name.capitalize()} {brand['name']} {reference}",
                            "width": w, "height": h, "needsReview": False}],
                "specs": specs, "isNew": False, "discontinued": False,
                "sourceUrl": (info.get("sources") or [None])[0] if found else None,
                "officialName": model or None, "source": {"page": None},
            })
            print(f"[{n}/{len(items)}] {sku}: {'ficha' if found else 'SIN ficha'} -> {final_name[:70]} [{category}]", flush=True)

    used = {p["categorySlug"] for p in products}
    catalog = {"source": f"Info_Completa/{doc_name}.docx + fichas oficiales", "brands": [{"id": brand["id"], "name": brand["name"], "logoUrl": None}],
               "categories": [{"id": s, "slug": s, "name": CATEGORIES[s], "parentSlug": "seguridad",
                               "position": CATEGORY_POSITION[s]} for s in CATEGORIES if s in used],
               "products": products}
    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    found_n = sum(1 for p in products if p["description"] or len(p["specs"]) > 1)
    lines = [f"# {brand['name']}: revisión", "", f"{len(products)} productos; {found_n} con ficha oficial encontrada.", "",
             f"## Sin ficha oficial ({len(report['sin_ficha'])})", ""] + [f"- {x}" for x in report["sin_ficha"]] + [
             "", f"## Nombre cortado en el documento y sin ficha para completarlo ({len(report['nombre_cortado_sin_ficha'])})", ""] + [
             f"- {x}" for x in report["nombre_cortado_sin_ficha"]] + [
             "", f"## Ficha descartada: no concuerda con el nombre del documento ({len(report['no_concuerda'])})", ""] + [
             f"- {x}" for x in report["no_concuerda"]] + [""]
    (out / "report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"\n{brand['name']}: {len(products)} productos, {found_n} con ficha oficial")


if __name__ == "__main__":
    main(sys.argv[1])
