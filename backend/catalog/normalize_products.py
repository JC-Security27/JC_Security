"""Aplica las reglas de redacción del usuario a nombre, descripción y características.

Uso:
    python -I backend/catalog/normalize_products.py --sample 12   # muestra antes/después, no guarda
    python -I backend/catalog/normalize_products.py                # todos los productos visibles

Correr al final, después de cualquier carga (publish_docs, enrich, etc.). Es idempotente:
cada producto se procesa según su contenido actual y el resultado queda en caché.

Reglas del usuario (2026-10-27):
1. Peso nunca solo en oz: g o kg, o g con oz entre paréntesis.
2. La etiqueta dice lo que es: Peso para pesos, Medida/Largo/Diámetro… para medidas.
3. Medidas en pulgadas y cm o m, según corresponda.
4. Todo en español (nombre, descripción y características).
5. Phillips en lugar de Pozidriv.
6. No mostrar el método de empaque.
7. No mostrar cantidades por caja/paquete del fabricante; sí las piezas que trae el producto.
8. No mostrar "Presentación": si repite otro dato se quita; si es el único lugar de un dato,
   se pasa a su etiqueta correcta.
No se agregan datos: solo se convierte, traduce, reetiqueta o quita.
"""
import concurrent.futures as cf
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sync_intrade as si  # noqa: E402

MODEL = "gpt-5.4-mini"
CACHE = HERE / ".cache_normalize"
WORKERS = 3
BATCH = 8
KEEP_SPECS = ("Código Intrade", "Código Dahua CR")  # códigos: no se tocan
DROP_SPECS = ("master", "master pack", "inner", "inner pack")  # cantidades por caja del fabricante
# Correcciones del usuario que no están en sus documentos: (texto viejo, texto nuevo) por producto.
FIXES = {
    # La foto muestra el refuerzo gris (pedido por Kiro/usuario, 2026-10-26).
    "tolsen-45024": [("en color negro", "en color gris"), ("Cuero dividido de vaca negro", "Cuero dividido de vaca gris")],
}

PROMPT = """Corriges fichas de productos de un catálogo en español (Costa Rica). Para cada producto recibes name, description (líneas que empiezan con "• ") y specs (nombre: valor). Devuelve el mismo producto corregido con estas reglas, SIN agregar datos nuevos:

1. Peso: nunca solo en onzas. Conviértelo a g (o kg si es ≥ 1000 g) y puedes dejar las oz entre paréntesis, ej. "227 g (8 oz)". 1 oz = 28,35 g; 1 lb = 453,6 g.
2. La etiqueta debe decir lo que es el valor: si es un peso, "Peso"; si es una longitud, "Medida", "Largo", "Diámetro", "Dimensiones", etc. Corrige etiquetas equivocadas (ej. "Medida: 8 oz" -> "Peso: 227 g (8 oz)").
3. Medidas de longitud en pulgadas y en cm o m, ej. '7" (18 cm)', '8 m (26 ft)'. Si solo viene en mm, puedes dejar mm y agregar pulgadas convertidas. Usa coma o punto decimal de forma consistente (punto).
4. Todo en español: traduce nombre, descripción y características que estén en inglés. Conserva modelos, marcas, normas y siglas (LED, PoE, IP67, H.265…).
5. Usa "Phillips" en lugar de "Pozidriv" (y "PH" en lugar de "PZ").
6. Quita el método de empaque (blíster, caja de color, bolsa, "packing", "empaque", etc.), sea línea de descripción o característica.
7. Quita cantidades por caja/paquete/cartón del fabricante (ej. "QTY/CARTON", "caja con 15 unidades", "paquete de 100" cuando se refiere a cómo se despacha). Conserva las piezas que forman el producto (ej. "Juego de 6 piezas", "Kit de 3 alicates").
8. Quita la característica "Presentación". Si su dato no aparece en otro lado, pásalo a la característica correcta (Medida, Peso, Piezas, Talla, Capacidad…).
- name: en MAYÚSCULAS, en español. No quites el modelo/código si lo trae.
- description: lista de líneas en español (sin el "• "). Puede quedar vacía si no venía.
- specs: lista de {name, value} ya corregida. Sin duplicados.
Responde solo el JSON pedido, con los productos en el mismo orden y con el mismo id."""

SCHEMA = {"type": "object", "properties": {"items": {"type": "array", "items": {"type": "object", "properties": {
    "id": {"type": "string"}, "name": {"type": "string"},
    "description": {"type": "array", "items": {"type": "string"}},
    "specs": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}, "value": {"type": "string"}},
                                          "required": ["name", "value"], "additionalProperties": False}}},
    "required": ["id", "name", "description", "specs"], "additionalProperties": False}}},
    "required": ["items"], "additionalProperties": False}


def openai_key():
    for line in (HERE.parent / ".env.supabase").read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip()


def payload(p):
    specs = {k: v for k, v in (p["specs"] or {}).items() if k not in KEEP_SPECS}
    desc = [l.lstrip("• ").strip() for l in (p["description"] or "").split("\n") if l.strip()]
    return {"id": p["id"], "name": p["name"], "description": desc, "specs": [{"name": k, "value": str(v)} for k, v in specs.items()]}


def normalize_batch(batch, api_key):
    raw = json.dumps([payload(p) for p in batch], ensure_ascii=False, sort_keys=True)
    path = CACHE / f"{hashlib.sha1((MODEL + PROMPT + raw).encode()).hexdigest()[:20]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    body = {"model": MODEL, "instructions": PROMPT, "input": raw, "reasoning": {"effort": "low"}, "store": False,
            "text": {"format": {"type": "json_schema", "name": "fichas", "strict": True, "schema": SCHEMA}}}
    req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.load(resp)
    text = "".join(c["text"] for o in data["output"] if o["type"] == "message" for c in o["content"] if c["type"] == "output_text")
    items = json.loads(text)["items"]
    path.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    return items


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    CACHE.mkdir(exist_ok=True)
    sample = int(sys.argv[sys.argv.index("--sample") + 1]) if "--sample" in sys.argv else None
    base, key = si.env()
    api_key = openai_key()
    rows, off = [], 0
    while True:
        page = json.loads(si.request("GET", f"{base}/rest/v1/products?select=id,name,description,specs"
                                            f"&available=eq.true&discontinued=eq.false&order=id&limit=1000&offset={off}", key))
        rows += page
        if len(page) < 1000:
            break
        off += 1000
    if sample:
        import random
        random.seed(11)
        # muestra variada: algunos con oz, Pozidriv, Presentación, inglés o empaque
        hints = ("oz", "Pozidriv", "Presentación", "Packing", "QTY", "Empaque", "Color box")
        hot = [r for r in rows if any(h.lower() in json.dumps(r, ensure_ascii=False).lower() for h in hints)]
        rows = random.sample(hot, min(sample, len(hot)))
    batches = [rows[i:i + BATCH] for i in range(0, len(rows), BATCH)]
    print(f"{len(rows)} productos en {len(batches)} lotes", flush=True)

    def work(batch):
        try:
            return batch, normalize_batch(batch, api_key)
        except Exception as e:
            return batch, e

    done = errors = 0
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        for batch, result in pool.map(work, batches):
            if isinstance(result, Exception):
                errors += len(batch)
                print(f"  error en lote: {result}", flush=True)
                continue
            by_id = {r["id"]: r for r in result}
            for p in batch:
                r = by_id.get(p["id"])
                if not r or not r["name"].strip():
                    errors += 1
                    continue
                keep = {k: v for k, v in (p["specs"] or {}).items() if k in KEEP_SPECS}
                code = si.norm(keep.get("Código Intrade") or "")
                specs = {**keep, **{s["name"]: s["value"] for s in r["specs"] if s["name"] and s["value"]
                                    # "Código de stock: 36002" repite el código de Intrade
                                    and not ("código" in s["name"].lower() and code and si.norm(s["value"]) == code)}}
                specs = {k: v for k, v in specs.items() if k.strip().lower() not in DROP_SPECS}
                new = {"name": r["name"].strip().upper(),
                       "description": "\n".join(f"• {l}" for l in r["description"] if l.strip()) or None, "specs": specs}
                for old, fixed in FIXES.get(p["id"], []):
                    new["description"] = new["description"] and new["description"].replace(old, fixed)
                    new["specs"] = {k: v.replace(old, fixed) for k, v in new["specs"].items()}
                if sample:
                    print(f"\n=== {p['id']}\nANTES : {p['name']}\n        {p['description']}\n        {p['specs']}")
                    print(f"AHORA : {new['name']}\n        {new['description']}\n        {new['specs']}")
                    continue
                si.request("PATCH", f"{base}/rest/v1/products?id=eq.{p['id']}", key, new)
                done += 1
            if not sample:
                print(f"  {done} actualizados", flush=True)
    if not sample:
        print(f"\nListo: {done} productos actualizados; {errors} con error (se reintentan en la próxima corrida)")


if __name__ == "__main__":
    main()
