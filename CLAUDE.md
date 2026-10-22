# JC Security

Reparto: Kiro hace el frontend (`frontend/`, Vercel); Claude hace el backend (`backend/`, Supabase).
Contrato de datos: `comunicacion/adjuntos/API_CONTRACT.md`.

## Backend

- Esquema, RLS y bucket: `backend/supabase/migrations/0001_catalogo.sql`.
- Catálogo PDF → datos: `python -I backend/catalog/extract_catalog.py "<pdf>" backend/catalog/output` (pymupdf, pillow).
- Carga a Supabase: `python -I backend/catalog/load_catalog.py backend/catalog/output`. Lee `backend/.env.supabase`, que no se versiona.

## Comunicación con Kiro

En este proyecto también trabaja Kiro (IDE de AWS). Se comunican por la carpeta `comunicacion/`:

- Al empezar cada tarea, lee `comunicacion/para-claude.md` y atiende los mensajes con `Estado: PENDIENTE`.
- Para escribirle a Kiro, agrega un mensaje al final de `comunicacion/para-kiro.md`.
- Sigue el formato y las reglas de `comunicacion/README.md`.
