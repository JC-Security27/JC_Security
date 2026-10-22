/* ==========================================================================
   JC Security — Configuración central del sitio
   -------------------------------------------------------------------------
   IMPORTANTE: Los datos oficiales de JC Security (WhatsApp, redes, contacto)
   están PENDIENTES. No se inventan. Cuando la empresa los proporcione, se
   rellenan aquí o vía variables de entorno (.env.local).
   ========================================================================== */

/** Marca "pendiente" un valor que JC Security aún no ha proporcionado. */
export const PENDING = "" as const;

export interface SocialLink {
  id: string;
  label: string;
  /** URL oficial. Vacío = pendiente, no se muestra como enlace activo. */
  url: string;
}

export interface ContactInfo {
  phone: string; // PENDIENTE
  email: string; // PENDIENTE
  address: string; // PENDIENTE
  hours: string; // PENDIENTE
}

export const siteConfig = {
  name: "JC Security",
  tagline: "Seguridad tecnológica para tu hogar y tu negocio",
  shortDescription:
    "Productos y servicios de seguridad. Explora el catálogo y consulta precio y disponibilidad por WhatsApp.",

  /**
   * Número de WhatsApp en formato internacional SIN "+", espacios ni guiones.
   * PENDIENTE: lo define JC Security. Se toma de VITE_WHATSAPP_NUMBER si existe.
   * Mientras esté vacío, la UI muestra el CTA pero avisa que falta configurarlo.
   */
  whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER as string) || PENDING,

  /**
   * Redes sociales oficiales. PENDIENTE: URLs reales de JC Security.
   * Se listan los canales previstos; sin URL se muestran como "próximamente".
   */
  socials: [
    { id: "facebook", label: "Facebook", url: PENDING },
    { id: "instagram", label: "Instagram", url: PENDING },
    { id: "tiktok", label: "TikTok", url: PENDING },
    { id: "youtube", label: "YouTube", url: PENDING },
  ] as SocialLink[],

  /** Datos de contacto. PENDIENTE: los proporciona JC Security. */
  contact: {
    phone: PENDING,
    email: PENDING,
    address: PENDING,
    hours: PENDING,
  } as ContactInfo,
} as const;

/** ¿Hay un número de WhatsApp configurado? */
export function hasWhatsApp(): boolean {
  return Boolean(siteConfig.whatsappNumber);
}
