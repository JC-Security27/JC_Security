import { SampleNotice } from "@/components/ui/states";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { serviceInquiryMessage } from "@/lib/whatsapp";
import { YEARS_OF_EXPERIENCE } from "@/components/home/homeStory";

/** Servicios reales confirmados por JC Security. `image` es opcional: sin ella
 *  la tarjeta muestra el fondo de muestra. Es el nombre base de las fotos en
 *  public/servicios/ (<image>-480/800/1200.webp, achicadas con buena calidad
 *  para que las líneas finas no hagan "moiré"); `widths` lista los tamaños que
 *  existen. `imagePosition` elige qué parte se ve al recortar (object-position). */
const services: {
  id: string;
  title: string;
  description: string;
  image?: string;
  widths?: number[];
  imagePosition?: string;
  /** "contain": la foto se ve completa (para fotos verticales), con la misma
   *  foto desenfocada de fondo para rellenar los costados. */
  imageFit?: "contain";
}[] = [
  {
    id: "planos-electricos",
    title: "Planos eléctricos",
    description:
      "Diseño y elaboración de planos eléctricos para hogares y negocios.",
    image: "planos-electricos",
    widths: [480, 800, 1200],
  },
  {
    id: "cerca-electrica",
    title: "Instalación de cerca eléctrica",
    description:
      "Instalación de cercas eléctricas perimetrales para proteger tu " +
      "propiedad.",
    image: "cerca-electrica",
    widths: [480, 800, 1200],
    imagePosition: "center 35%",
  },
  {
    id: "camaras-seguridad",
    title: "Instalación de cámaras de seguridad",
    description:
      "Montaje y configuración de cámaras de seguridad para hogares y " +
      "negocios.",
  },
  {
    id: "trabajos-altura",
    title: "Trabajos de altura",
    description:
      "Trabajos en altura con el equipo y las medidas de seguridad " +
      "adecuadas.",
    image: "trabajos-altura",
    widths: [480, 800],
    imageFit: "contain",
  },
  {
    id: "certificacion-normativa",
    title: "Certificación según normativa vigente",
    description:
      "Certificación de instalaciones eléctricas de acuerdo con la " +
      "normativa vigente.",
    image: "certificacion",
    widths: [480, 800, 1200],
  },
  {
    id: "mantenimiento-equipos",
    title: "Mantenimiento de equipos instalados",
    description:
      "Mantenimiento de los equipos de seguridad instalados para que " +
      "sigan funcionando correctamente.",
  },
  {
    id: "inspeccion-electrica",
    title: "Inspección de instalaciones eléctricas",
    description:
      "Revisión de instalaciones eléctricas para detectar fallas y " +
      "riesgos.",
    image: "inspeccion-electrica",
    widths: [480, 800],
  },
];

export function ServicesPage() {
  return (
    <section className="section container">
      {/* Encabezado con el robot ingeniero (pedido del usuario) */}
      <div className="services-hero">
        <div className="services-hero-copy">
          <span className="eyebrow">Experiencia</span>
          <h1>Servicios</h1>
          <p className="services-hero-lead">
            Desde el plano hasta la instalación y el mantenimiento: llevamos{" "}
            {YEARS_OF_EXPERIENCE} años realizando trabajos eléctricos y de
            seguridad para hogares y negocios en Costa Rica.
          </p>
          <ul className="services-highlights">
            <li>
              <strong>{YEARS_OF_EXPERIENCE} años</strong>
              <span>de experiencia</span>
            </li>
            <li>
              <strong>{services.length}</strong>
              <span>servicios</span>
            </li>
            <li>
              <strong>Normativa</strong>
              <span>vigente</span>
            </li>
          </ul>
          <ol className="services-steps">
            <li>
              <strong>Cuéntanos qué necesitas</strong>
              <span>Escríbenos por WhatsApp con el servicio y el lugar.</span>
            </li>
            <li>
              <strong>Revisamos y cotizamos</strong>
              <span>Te damos una propuesta según tu instalación.</span>
            </li>
            <li>
              <strong>Realizamos el trabajo</strong>
              <span>Con el equipo y las medidas de seguridad adecuadas.</span>
            </li>
          </ol>
          <WhatsAppButton message={serviceInquiryMessage("Servicios")}>
            Solicitar un servicio
          </WhatsAppButton>
        </div>
        <div className="services-hero-visual" aria-hidden="true">
          <span className="services-hero-glow" />
          <img src="/robot-ingeniero.png" alt="" className="services-robot" />
        </div>
      </div>

      <h2 className="services-list-title">Nuestros servicios</h2>

      <div className="services-grid">
        {services.map((s) => (
          <div key={s.id} className="card service-card">
            <div
              className={`service-card-media ${s.imageFit === "contain" ? "is-contain" : ""}`}
              aria-hidden="true"
            >
              {s.image && s.imageFit === "contain" && (
                <img
                  src={`/servicios/${s.image}-480.webp`}
                  alt=""
                  loading="lazy"
                  className="service-card-media-bg"
                />
              )}
              {s.image && (
                <img
                  src={`/servicios/${s.image}-800.webp`}
                  srcSet={(s.widths ?? [800])
                    .map((w) => `/servicios/${s.image}-${w}.webp ${w}w`)
                    .join(", ")}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 25vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={s.imagePosition ? { objectPosition: s.imagePosition } : undefined}
                />
              )}
            </div>
            <div className="service-card-body">
              <span className="chip chip-accent service-card-tag">
                Servicio
              </span>
              <h3 className="service-card-title">{s.title}</h3>
              <p className="muted service-card-desc">{s.description}</p>
              <WhatsAppButton
                message={serviceInquiryMessage(s.title)}
                className="btn btn-whatsapp btn-sm btn-block service-card-cta"
              >
                Consultar por WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        ))}
      </div>

      <SampleNotice>
        <strong>Más servicios en camino.</strong> Iremos agregando fotos y
        descripciones de otros servicios cuando JC Security proporcione el
        contenido. No se inventa contenido.
      </SampleNotice>
    </section>
  );
}
