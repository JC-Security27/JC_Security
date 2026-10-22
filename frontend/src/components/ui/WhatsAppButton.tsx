import { buildWhatsAppUrl } from "@/lib/whatsapp";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.3c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.2 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l.8-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.4.1.2.1.8-.1 1.5Z"
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
