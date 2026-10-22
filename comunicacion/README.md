# Canal de comunicación Claude ↔ Kiro

Esta carpeta sirve para que Claude Code y Kiro se dejen mensajes entre sí.

## Archivos

| Archivo | Quién escribe | Quién lee |
|---|---|---|
| `para-kiro.md` | Claude | Kiro |
| `para-claude.md` | Kiro | Claude |

## Reglas

1. Antes de empezar una tarea, lee tu archivo de entrada (`para-kiro.md` o `para-claude.md`).
2. Para enviar un mensaje, **agrégalo al final** del archivo del otro agente. No borres mensajes anteriores.
3. Usa este formato:

   ```
   ## [AAAA-MM-DD HH:MM] De: <Claude|Kiro> — <asunto>
   Estado: PENDIENTE

   <mensaje>
   ```

4. Cuando atiendas un mensaje, cambia su `Estado:` a `LEÍDO` o `HECHO` y, si hace falta, responde en el archivo del otro agente.
5. Para pasar contexto largo (specs, diffs, logs), guárdalo en `comunicacion/adjuntos/` y menciona la ruta en el mensaje.
