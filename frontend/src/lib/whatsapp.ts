/* ==========================================================================
   JC Security — Helpers para construir enlaces de WhatsApp
   El número oficial está en config/site.ts (PENDIENTE hasta que lo dé la
   empresa). Estas funciones NO inventan número: si falta, devuelven null.
   ========================================================================== */

import { siteConfig } from "@/config/site";
import type { Product } from "@/types/catalog";

/** Ítem de la lista de cotización usado para armar el mensaje. */
export interface QuoteMessageItem {
  name: string;
  reference: string;
  quantity: number;
}

const WA_BASE = "https://wa.me/";

/**
 * Construye una URL de WhatsApp con mensaje prellenado.
 * Devuelve null si no hay número configurado (para que la UI avise).
 */
export function buildWhatsAppUrl(message: string): string | null {
  const number = siteConfig.whatsappNumber;
  if (!number) return null;
  const encoded = encodeURIComponent(message);
  return `${WA_BASE}${number}?text=${encoded}`;
}

/** Mensaje para consultar por un solo producto. */
export function productInquiryMessage(product: Product): string {
  const lines = [
    `Hola ${siteConfig.name}, me interesa este producto:`,
    "",
    `• ${product.name}`,
    `  Referencia: ${product.reference}`,
  ];
  if (product.brandName) lines.push(`  Marca: ${product.brandName}`);
  lines.push("", "¿Me pueden indicar precio y disponibilidad? Gracias.");
  return lines.join("\n");
}

/** Mensaje para la lista de cotización (varios productos). */
export function quoteListMessage(items: QuoteMessageItem[]): string {
  const header = [
    `Hola ${siteConfig.name}, quiero consultar precio y disponibilidad de:`,
    "",
  ];
  const body = items.map(
    (it) => `• ${it.quantity} x ${it.name} (Ref: ${it.reference})`
  );
  return [...header, ...body, "", "Quedo atento(a). Gracias."].join("\n");
}

/** Mensaje genérico de contacto. */
export function generalContactMessage(): string {
  return `Hola ${siteConfig.name}, me gustaría recibir más información.`;
}

/** Mensaje para consultar por un servicio por su nombre. */
export function serviceInquiryMessage(serviceName: string): string {
  return [
    `Hola ${siteConfig.name}, me interesa el servicio de ${serviceName}.`,
    "",
    "¿Me pueden dar más información? Gracias.",
  ].join("\n");
}
