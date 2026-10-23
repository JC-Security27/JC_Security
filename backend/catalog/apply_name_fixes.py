"""Corrige nombres del PDF que no corresponden al producto real.

Uso:
    python -I backend/catalog/apply_name_fixes.py backend/catalog/output

Solo para casos verificados: la referencia está en la ficha oficial de Tolsen y la
foto (incluida la del propio PDF) muestra ese producto. El nombre original queda
en pdfName. Revisión del 2026-10-23.
"""
import json
import sys
from pathlib import Path

NAME_FIXES = {
    # ref: (nombre corregido, motivo)
    "10003": ("ALICATE DE CORTE DIAGONAL", "oficial: Diagonal cutting pliers; el PDF dice solo «Cortadora»"),
    "10004": ("ALICATE DE CORTE DIAGONAL", "oficial: Diagonal cutting pliers; el PDF dice solo «Cortadora»"),
    "20012": ("DESATORNILLADOR POZIDRIV IMANTADO", "oficial: Screwdriver (Pozidriv), no Phillips"),
    "20164": ("DESATORNILLADOR POZIDRIV", "oficial: Screwdriver (Pozidriv), no Phillips"),
    "20063": ("JUEGO DE 8 DESTORNILLADORES TORX CON MANGO EN T", "oficial: 8pcs Torx T-handle screwdrivers set"),
    "43042": ("PISTOLA APLICADORA DE SILICÓN", "oficial: Caulking gun (cartuchos de silicón/sellador), no pegamento"),
    "43049": ("PISTOLA APLICADORA DE SILICÓN INDUSTRIAL", "oficial: Heavy duty caulking gun"),
    "44911": ("SOPORTE MAGNÉTICO PARA SOLDAR", "oficial: Magnetic welding holder"),
    "80131": ("DELANTAL DE TALLER", "oficial: Workshop apron; el PDF dice «Chaleco»"),
    "V16006": ("ALICATE UNIVERSAL AISLADO", "oficial: Insulated combination pliers; el PDF dice «Pelador de cable»"),
    # El PDF llama «CAUTÍN 30W 120V» a los tres, pero son de 30, 50 y 60 W (la potencia va en la presentación).
    "38513": ("CAUTÍN 120V", "el PDF pone 30W en el nombre de las tres potencias"),
    "38515": ("CAUTÍN 120V", "el PDF pone 30W en el nombre de las tres potencias"),
    "38516": ("CAUTÍN 120V", "el PDF pone 30W en el nombre de las tres potencias"),
}


def main(out_dir):
    path = Path(out_dir) / "catalog.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    for p in catalog["products"]:
        p.setdefault("pdfName", p["name"])
        fix = NAME_FIXES.get(p["reference"])
        p["name"] = fix[0] if fix else p["pdfName"]
        p["nameFix"] = fix[1] if fix else None
        for img in p["images"]:
            img["alt"] = f"{p['name'].capitalize()} Tolsen"
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{sum(1 for p in catalog['products'] if p['nameFix'])} nombres corregidos")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "backend/catalog/output")
