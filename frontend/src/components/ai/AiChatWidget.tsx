import { useRef, useState } from "react";
import {
  AiNotConnectedError,
  isAiChatEnabled,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/aiChat";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { generalContactMessage } from "@/lib/whatsapp";

/* ==========================================================================
   Widget de chat del agente de IA.
   - Interfaz lista (la hace Kiro). Backend/modelo lo hace Claude.
   - Se identifica CLARAMENTE como IA.
   - Si el asistente no está conectado, lo dice con claridad y ofrece WhatsApp.
   - No inventa respuestas, precios ni especificaciones.
   ========================================================================== */

const AI_DISCLAIMER =
  "Soy un asistente virtual (IA) de JC Security. Puedo orientarte con " +
  "información general. Para precio y disponibilidad, te conecto con una " +
  "persona por WhatsApp.";

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const enabled = isAiChatEnabled();

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    scrollToEnd();
    try {
      const reply = await sendChatMessage(next);
      setMessages((m) => [...m, { role: "assistant", content: reply.reply }]);
    } catch (err) {
      if (err instanceof AiNotConnectedError) {
        setNotConnected(true);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Tuvimos un problema para responder. Por favor, inténtalo de " +
              "nuevo o escríbenos por WhatsApp.",
          },
        ]);
      }
    } finally {
      setPending(false);
      scrollToEnd();
    }
  };

  return (
    <>
      <button
        type="button"
        className="ai-fab"
        aria-expanded={open}
        aria-controls="ai-chat-panel"
        onClick={() => setOpen((v) => !v)}
        title="Asistente virtual (IA)"
      >
        {open ? "×" : "Asistente IA"}
      </button>

      {open && (
        <div
          id="ai-chat-panel"
          className="ai-panel card"
          role="dialog"
          aria-label="Asistente virtual de JC Security"
        >
          <header className="ai-header">
            <div>
              <strong>Asistente JC Security</strong>
              <span className="ai-badge">IA</span>
            </div>
            <button
              type="button"
              className="ai-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
            >
              ×
            </button>
          </header>

          <div className="ai-messages" ref={listRef}>
            <div className="ai-msg ai-msg-bot">
              <p>{AI_DISCLAIMER}</p>
            </div>

            {!enabled && (
              <div className="ai-msg ai-msg-system">
                <p>
                  <strong>El asistente aún no está conectado.</strong> La
                  integración con el modelo la configurará el equipo cuando JC
                  Security proporcione la API y el contenido oficial. Mientras
                  tanto, puedes escribirnos directamente.
                </p>
                <WhatsAppButton
                  message={generalContactMessage()}
                  className="btn btn-whatsapp btn-sm"
                >
                  Hablar por WhatsApp
                </WhatsAppButton>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`ai-msg ${
                  m.role === "user" ? "ai-msg-user" : "ai-msg-bot"
                }`}
              >
                <p>{m.content}</p>
              </div>
            ))}

            {pending && (
              <div className="ai-msg ai-msg-bot">
                <p className="ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </p>
              </div>
            )}

            {notConnected && (
              <div className="ai-msg ai-msg-system">
                <p>
                  No puedo responder porque el asistente todavía no está
                  conectado. ¿Te conecto con una persona?
                </p>
                <WhatsAppButton
                  message={generalContactMessage()}
                  className="btn btn-whatsapp btn-sm"
                >
                  Hablar por WhatsApp
                </WhatsAppButton>
              </div>
            )}
          </div>

          <form
            className="ai-input"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                enabled ? "Escribe tu pregunta…" : "Asistente no disponible aún"
              }
              disabled={!enabled || pending}
              aria-label="Mensaje para el asistente"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!enabled || pending || !input.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
