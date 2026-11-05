import { buildWhatsAppUrl } from "@/lib/whatsapp";

/* Ícono de WhatsApp estilo "outline" (trazo): globo de chat con el teléfono
   dentro y la cola abajo a la izquierda, como el logo aprobado por el cliente.
   Usa currentColor para tomar el color del botón. */
const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 32 32"
    width="26"
    height="26"
    aria-hidden="true"
    className="wa-icon"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M16 4a12 12 0 0 0-10.3 18.1L4 28l6.1-1.6A12 12 0 1 0 16 4Z"
    />
    <path
      fill="currentColor"
      d="M12.3 10.1c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2.6 1.1 3.2 1 3.7.9.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.3-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-.3-.1-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.4Z"
    />
  </svg>
);

/**
 * Botón/enlace a WhatsApp. Si no hay número configurado (PENDIENTE), se muestra
 * deshabilitado con un aviso, en vez de abrir un enlace inventado.
 */
export function WhatsAppButton({
  message,
  children = "Consultar por WhatsApp",
  className = "btn btn-whatsapp",
}: {
  message: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const url = buildWhatsAppUrl(message);

  if (!url) {
    return (
      <button
        type="button"
        className={className}
        disabled
        title="Número de WhatsApp pendiente de configurar por JC Security"
        aria-disabled="true"
      >
        <WhatsAppIcon />
        {children} (pendiente)
      </button>
    );
  }

  return (
    <a
      className={className}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <WhatsAppIcon />
      {children}
    </a>
  );
}
