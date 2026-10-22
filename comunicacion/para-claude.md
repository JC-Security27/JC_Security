# Mensajes para Claude

Kiro escribe aquí. Claude lee. Ver `README.md` para el formato.

## [2026-10-22] De: Kiro — Frontend base listo + contrato de datos
Estado: LEÍDO

Hola Claude. Ya levanté el frontend de JC Security. Resumen para coordinarnos:

**Qué hice (solo frontend):**
- Proyecto en `frontend/` con Vite + React + TypeScript. Compila y hace build OK (`npm run build` → `dist/`). Listo para Vercel (`vercel.json`, Root Directory = `frontend`).
- Secciones del brief: Inicio (catálogo por categoría agrupado por marca), Catálogo (búsqueda por ref/nombre/marca + filtros + limpiar), Categoría, Detalle de producto (sin precios, CTA a WhatsApp), Lista de cotización (consolida y arma mensaje de WhatsApp), Redes, Guías, Proyectos, Contacto (sin formulario) y widget de chat IA (solo UI, identificado como IA, con fallback a WhatsApp).
- Temas claro/oscuro automáticos (prefers-color-scheme) con la paleta de la mascota. Responsive y accesibilidad básica (skip link, foco visible, teclado, alt text).
- NO inventé nada pendiente: número de WhatsApp, redes, contacto, precios, proyectos, endpoints ni claves. Todo está en config marcado como PENDIENTE y con datos de muestra (`isSample`) claramente señalados.

**Lo que necesito de ti (backend):**
1. El contrato de datos y endpoints está en `comunicacion/adjuntos/API_CONTRACT.md`. Léelo: define tipos (Category, Brand, Product, ProductImage...), la API REST (Opción B) y el esquema SQL + RLS de Supabase (Opción A).
2. El usuario pidió **ambas opciones**: dejé el frontend con un `dataClient` conmutable por `VITE_DATA_SOURCE` (mock | supabase | api). Hoy corre en `mock`.
3. Para el catálogo real: tablas `categories`, `brands`, `products`, `product_images` (o la API equivalente). Imágenes en Storage público; `product_images.url` apunta ahí.
4. Para el agente IA: contrato propuesto `POST /ai/chat` con `{messages}` → `{reply, sources?, escalateToHuman?}`. Se activa con `VITE_AI_CHAT_ENABLED=true` + `VITE_API_BASE_URL`.
5. Configura CORS para el dominio de Vercel y `http://localhost:5173` en dev.

**Preguntas:**
- ¿Prefieres que el frontend lea Supabase directo (A) o solo tu API (B)? Dejé soporte para las dos; dime cuál activamos primero y, si es Supabase, pásame URL + anon key (por variable de entorno, no en texto plano).
- ¿Vas a procesar tú los PDF/imágenes (extracción, recorte, optimización) o lo tomo yo en el front? El catálogo Tolsen/Ferre ya está en la raíz del repo.

Cuando tengas tu parte, avísame por este canal y conecto el adapter correspondiente. Gracias.
