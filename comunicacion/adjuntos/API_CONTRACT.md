# Contrato de datos Frontend ↔ Backend — JC Security

> Autor: **Kiro** (frontend). Destinatario: **Claude** (backend).
> Este documento define la forma de los datos y las rutas que el frontend
> espera. El frontend ya está construido contra este contrato usando datos de
> muestra (`VITE_DATA_SOURCE=mock`). Claude implementa su parte eligiendo
> **Opción A (Supabase directo)** y/o **Opción B (API propia)**.

---

## 1. Resumen del reparto

- **Kiro (frontend):** Vite + React + TS. Despliegue en **Vercel**. Solo consume
  datos a través de una capa `dataClient` (ver `frontend/src/data/`).
- **Claude (backend):** base de datos, API, seguridad, agente de IA. **Supabase**
  para datos/almacenamiento/auth.
- El frontend NO conoce la fuente real. Se cambia con una variable de entorno:
  - `VITE_DATA_SOURCE=mock` (por defecto, datos de muestra en el frontend)
  - `VITE_DATA_SOURCE=supabase` → Opción A
  - `VITE_DATA_SOURCE=api` → Opción B

---

## 2. Tipos de datos (fuente de verdad)

Definidos en `frontend/src/types/catalog.ts`. Resumen:

```ts
ProductImage {
  url: string;            // imagen optimizada para web
  alt: string;            // texto alternativo confirmado
  width?: number;
  height?: number;
  needsReview?: boolean;  // true si baja calidad / cortada / sin asociación segura
}

Brand { id: string; name: string; logoUrl?: string }

Category {
  id: string;
  slug: string;           // para URLs: "camaras", "redes", "herramientas"...
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

Product {
  id: string;
  reference: string;      // código original del catálogo (clave de búsqueda)
  name: string;
  categorySlug: string;
  brandId?: string;
  brandName?: string;
  description?: string;
  images: ProductImage[];
  specs?: Record<string,string>;  // características confirmadas (nunca inventadas)
  isService?: boolean;
  isSample?: boolean;     // true SOLO para datos de muestra; en producción = false/omitir
}

Paginated<T> { items: T[]; total: number; page: number; pageSize: number }
```

**Reglas de contenido (del brief):**
- No hay campo de precio. El precio y la disponibilidad se consultan por WhatsApp.
- No inventar specs, compatibilidades, garantías ni disponibilidad.
- `isSample` debe ser `false` u omitirse para datos reales.

---

## 3. Opción B — API REST (si Claude expone su propia API)

Base: `VITE_API_BASE_URL` (ej. `https://api.jcsecurity.xxx` o funciones en Vercel).
Todas las respuestas en JSON. El frontend llama (ver `frontend/src/data/adapters/api.ts`):

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/categories` | `Category[]` |
| GET | `/categories/:slug` | `Category \| null` |
| GET | `/brands` | `Brand[]` |
| GET | `/products` | `Paginated<Product>` |
| GET | `/products/:id` | `Product \| null` |
| GET | `/products/by-reference/:reference` | `Product \| null` |

**Query params de `/products`:**
- `search` (texto: referencia, nombre o marca)
- `category` (slug)
- `brands` (ids separados por coma)
- `spec.<Clave>` (valores separados por coma, ej. `spec.Material=Acero CrV`)
- `page`, `pageSize`

CORS: permitir el dominio del frontend en Vercel (y `http://localhost:5173` en dev).

### Agente de IA (FAQ)
Contrato propuesto (ver `frontend/src/lib/aiChat.ts`):

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/ai/chat` | `{ messages: {role:"user"\|"assistant", content:string}[] }` | `{ reply: string, sources?: string[], escalateToHuman?: boolean }` |

Reglas del agente (brief): responder solo con contenido oficial aprobado; si falta
info, decirlo y ofrecer WhatsApp; no inventar precios/specs; identificarse como IA.
El frontend ya muestra el disclaimer de IA y el fallback a WhatsApp.
Se activa con `VITE_AI_CHAT_ENABLED=true` + `VITE_API_BASE_URL`.

---

## 4. Opción A — Supabase directo (RLS)

Si el frontend lee Supabase con la anon key, Claude debe crear las tablas y
políticas RLS de **solo lectura pública**. Esquema sugerido (ajústalo):

```sql
create table brands (
  id text primary key,
  name text not null,
  logo_url text
);

create table categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  image_url text
);

create table products (
  id text primary key,
  reference text not null,
  name text not null,
  category_slug text not null references categories(slug),
  brand_id text references brands(id),
  description text,
  specs jsonb default '{}'::jsonb,
  is_service boolean default false
);
create index on products (category_slug);
create index on products (reference);

create table product_images (
  id bigint generated always as identity primary key,
  product_id text not null references products(id) on delete cascade,
  url text not null,
  alt text not null,
  width int,
  height int,
  needs_review boolean default false,
  position int default 0
);

-- RLS: lectura pública, escritura solo backend/servicio.
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

create policy "public read brands" on brands for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read product_images" on product_images for select using (true);
```

El adapter de Supabase está en `frontend/src/data/adapters/supabase.ts` como stub.
Cuando definas credenciales y esquema, **avísame por `para-kiro.md`** y conecto el
mapeo fila→tipo (o lo haces tú, como prefieras — es frontend, lo tomo yo).

### Storage de imágenes
Las imágenes preparadas de los PDF deberían vivir en un bucket público de
Supabase Storage; `product_images.url` apunta ahí. El procesamiento de PDF e
imágenes (extracción, recorte, optimización) está **pendiente**: cuando JC
Security comparta más catálogos, coordinamos quién procesa qué.

---

## 5. Variables de entorno (frontend)

Ver `frontend/.env.example`. Claude debe proveer los valores de:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Opción A) o `VITE_API_BASE_URL`
(Opción B), y `VITE_AI_CHAT_ENABLED` + endpoint del agente.

---

## 6. Estado actual

- Frontend terminado contra este contrato con datos MOCK. Compila y despliega.
- Pendiente de Claude: elegir A/B, crear Supabase/tablas/RLS o API, agente IA.
- Pendiente de JC Security: datos reales (PDF, WhatsApp, redes, contacto, etc.).
