/* ==========================================================================
   JC Security — Cliente del agente de IA (FAQ)
   -------------------------------------------------------------------------
   La integración del modelo y la base de conocimiento las implementa Claude
   en el backend. El frontend SOLO conoce este contrato HTTP. Hasta que la
   API esté disponible (VITE_AI_CHAT_ENABLED=true + VITE_API_BASE_URL), el
   cliente NO inventa respuestas: informa que el asistente aún no está
   conectado y ofrece contacto humano por WhatsApp.
   Contrato propuesto (ver API_CONTRACT.md):
     POST {API_BASE}/ai/chat
     body: { messages: {role, content}[] }
     resp: { reply: string, sources?: string[], escalateToHuman?: boolean }
   ========================================================================== */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  sources?: string[];
  /** true si el backend recomienda derivar a un humano (WhatsApp). */
  escalateToHuman?: boolean;
}

export function isAiChatEnabled(): boolean {
  return (
    import.meta.env.VITE_AI_CHAT_ENABLED === "true" &&
    Boolean(import.meta.env.VITE_API_BASE_URL)
  );
}

export class AiNotConnectedError extends Error {
  constructor() {
    super(
      "El asistente de IA aún no está conectado. Pendiente: Claude debe " +
        "exponer POST /ai/chat y habilitar VITE_AI_CHAT_ENABLED."
    );
    this.name = "AiNotConnectedError";
  }
}

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<ChatReply> {
  if (!isAiChatEnabled()) {
    // No inventamos respuestas del modelo.
    throw new AiNotConnectedError();
  }
  const base = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "");
  const res = await fetch(`${base}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    throw new Error(`[aiChat] ${res.status} al contactar el asistente`);
  }
  return (await res.json()) as ChatReply;
}
