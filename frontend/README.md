# JC Security — Frontend

Página web pública de JC Security (productos y servicios de seguridad).
Construida por **Kiro**. El backend (datos, API, agente de IA) lo construye
**Claude**. Ver el contrato en `../comunicacion/adjuntos/API_CONTRACT.md`.

## Stack

- **Vite + React + TypeScript**
- CSS con variables nativas (temas claro/oscuro automáticos)
- **React Router** para la navegación
- Despliegue en **Vercel**

## Requisitos

- Node.js 18+ (probado con Node 26)

## Puesta en marcha

```bash
cd frontend
npm install
cp .env.example .env.local   # ajusta las variables cuando estén disponibles
npm run dev                  # servidor de desarrollo (http://localhost:5173)
```

> En Windows, si PowerShell bloquea `npm`, usa `cmd /c "npm install"` o ejecuta
> los comandos desde CMD.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción (type-check + Vite)
- `npm run preview` — previsualiza el build
- `npm run typecheck` — solo verificación de tipos

## Fuentes de datos (dataClient)

El frontend solo habla con `src/data/dataClient.ts`. La fuente se elige con
`VITE_DATA_SOURCE`:

| Valor | Qué hace |
|---|---|
| `mock` (por defecto) | Datos de muestra incluidos. Para desarrollo y preview. |
| `supabase` | Lee directo de Supabase (Opción A). Lo configura Claude. |
| `api` | Consume la API del backend de Claude (Opción B). |

Cambiar de fuente **no** requiere tocar componentes.

## Estructura

```
src/
  components/
    ai/        Widget del asistente de IA (solo UI)
    catalog/   Tarjeta de producto, filtros, agrupación por marca
    layout/    Header, Footer, Layout, ScrollToTop
    ui/        Botones, estados (carga/vacío/error), logo, tema
  config/      site.ts — datos de la empresa (placeholders PENDIENTE)
  context/     ThemeContext, QuoteContext
  data/        dataClient + adapters (mock, supabase, api) + mock.ts
  hooks/       useAsync
  lib/         whatsapp.ts, aiChat.ts
  pages/       Home, Catálogo, Categoría, Producto, Cotización, Redes,
               Guías, Proyectos, Contacto, 404
  styles/      global.css + components.css + pages.css
  types/       catalog.ts (contrato de datos)
```

## Pendiente de JC Security

Todo esto está marcado como pendiente en el código (no se inventa):

- Catálogos PDF con datos e imágenes de productos
- Número oficial de WhatsApp (`VITE_WHATSAPP_NUMBER`)
- Enlaces de redes sociales
- Logo y colores oficiales (la paleta actual deriva de la mascota)
- Teléfono, correo, dirección y horario
- Contenido de FAQ / agente de IA y su API
- Fotos y descripciones de proyectos
- Guías de seguridad

## Despliegue en Vercel

- Framework: Vite · Build: `npm run build` · Output: `dist`
- `vercel.json` incluye el rewrite SPA para que las rutas funcionen.
- Configura las variables `VITE_*` en el panel de Vercel.
```
Root Directory en Vercel: frontend
```
