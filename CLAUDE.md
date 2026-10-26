# JC Security

Reparto: Kiro hace el frontend (`frontend/`, Vercel); Claude hace el backend (`backend/`, Supabase).
Contrato de datos: `comunicacion/adjuntos/API_CONTRACT.md`.

## Backend

- Esquema, RLS y bucket: `backend/supabase/migrations/0001_catalogo.sql`.
- Catálogo PDF → datos: `python -I backend/catalog/extract_catalog.py "<pdf>" backend/catalog/output` (pymupdf, pillow).
- Carga a Supabase: `python -I backend/catalog/load_catalog.py backend/catalog/output`. Lee `backend/.env.supabase`, que no se versiona.
- `backend/.env.supabase` también tiene `SUPABASE_ACCESS_TOKEN` (Management API: SQL vía `POST /v1/projects/xehegspjlbpkvhsgcdqj/database/query`, secrets) y `OPENAI_API_KEY`. Deploy de funciones: `SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy ai --project-ref xehegspjlbpkvhsgcdqj --use-api` (desde `backend/`).
- Fotos oficiales Tolsen (800 px) en lugar de las del PDF: `python -I backend/catalog/fetch_official_images.py backend/catalog/output` y luego `load_catalog.py`.
- Orden completo del catálogo (cada paso se puede repetir; usa la caché en `output/.cache/`): `fetch_official_images.py` → `enrich_official_data.py` (ficha oficial traducida con OpenAI) → `apply_name_fixes.py` → `assign_variants.py` → `load_catalog.py`. Las correcciones manuales viven en `REJECTED`/`OVERRIDES` (fetch) y `NAME_FIXES`. Informe para el usuario: `backend/catalog/output/revision_catalogo.md`.
- Dahua (grupo `seguridad`): `backend/catalog/dahua/` → `extract_dahua_pdf.py "<pdf Dahua CR>"` → (`fetch_dahua.py`, lento: Crawl-delay 100 s) → `build_dahua.py` → `load_catalog.py backend/catalog/dahua/output`. De intradeabc.com solo se usa la lista de modelos (su robots prohíbe a asistentes IA usar su contenido: no copiar fotos ni textos). Revisión: `backend/catalog/dahua/output/report.md`.
- El PDF `backend/catalog/nuevos/Catalogo_Tolsen_Ferre_imagenes_mejoradas.pdf` trae varias fotos de otro producto: no usarlo en bloque. Se extrae con `RENDER_ZOOM=5` y se aplican solo fotos revisadas a mano con `use_pdf_images.py`. Estado y pendientes: `backend/catalog/output/fotos_por_corregir.md`.
- Búsqueda sin tildes + tabla `faq`: `backend/supabase/migrations/0002_busqueda_y_faq.sql`.
- Asistente IA: Edge Function `backend/supabase/functions/ai/index.ts` (OpenAI, decisión del usuario). Responde en `POST /functions/v1/ai/chat` y usa solo el catálogo (`search_products`) y las `faq` aprobadas. Secret `OPENAI_API_KEY`; `verify_jwt = false`.

## Comunicación con Kiro

En este proyecto también trabaja Kiro (IDE de AWS). Se comunican por la carpeta `comunicacion/`:

- Al empezar cada tarea, lee `comunicacion/para-claude.md` y atiende los mensajes con `Estado: PENDIENTE`.
- Para escribirle a Kiro, agrega un mensaje al final de `comunicacion/para-kiro.md`.
- Sigue el formato y las reglas de `comunicacion/README.md`.
