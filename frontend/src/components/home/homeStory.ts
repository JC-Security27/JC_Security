import { groupCatalogUrl } from "@/lib/categoryGroups";

/* ==========================================================================
   Contenido de la portada "con historia" (scrollytelling, pedido del usuario
   2026-10-28). Las fotos son productos reales del catálogo (bucket público de
   Supabase, fotos originales de Intrade con su visto bueno). Si un producto
   deja de venderse, cambiar aquí su id/foto.
   ========================================================================== */

const IMG = "https://xehegspjlbpkvhsgcdqj.supabase.co/storage/v1/object/public/catalogo/";

/** Años de experiencia de JC Security (dato del usuario, 2026-10-28). */
export const YEARS_OF_EXPERIENCE = 15;

export interface StoryProduct {
  id: string;
  name: string;
  img: string;
}

export interface StoryChapter {
  id: string;
  kicker: string; // verbo corto: "Vigila", "Detecta"…
  title: string;
  text: string;
  points: string[];
  brands: string;
  cta: { label: string; to: string };
  /** Color de acento del capítulo (brillo de fondo). */
  color: string;
  products: [StoryProduct, StoryProduct, StoryProduct];
}

export const STORY: StoryChapter[] = [
  {
    id: "vigila",
    kicker: "Vigila",
    title: "Ojos en tu casa y tu negocio, día y noche",
    text: "Cámaras IP y analógicas con visión nocturna a color, inteligencia artificial y acceso desde el celular, con grabadores para guardar todo.",
    points: ["Visión nocturna a color", "Detección de personas y vehículos", "Ver en vivo desde el celular"],
    brands: "Dahua · Ajax · IMOU · DLX",
    cta: { label: "Ver cámaras", to: groupCatalogUrl("camaras") },
    color: "#42d7e7",
    products: [
      { id: "dahua-ipchfw2449tzasil", name: "Cámara bullet IP 4 MP", img: IMG + "dahua-ipchfw2449tzasil-hq.webp" },
      { id: "dahua-ipchdw2849tsil", name: "Cámara eyeball 8 MP", img: IMG + "dahua-ipchdw2849tsil-hq.webp" },
      { id: "ajax-ajturretcam", name: "Cámara turret Ajax 5 MP", img: IMG + "ajax-ajturretcam-hq.webp" },
    ],
  },
  {
    id: "detecta",
    kicker: "Detecta",
    title: "Alarma de alerta temprana",
    text: "Paneles de alarma, sensores de movimiento, de puertas y de humo, sirenas y teclados, cableados o inalámbricos.",
    points: ["Aviso inmediato al celular", "Sensores de humo e incendio", "Instalación cableada o inalámbrica"],
    brands: "Ajax · Paradox · Fire-Lite · Mircom",
    cta: { label: "Ver alarmas", to: groupCatalogUrl("alarmas") },
    color: "#ff9f5a",
    products: [
      { id: "ajax-ajhub4g", name: "Central de alarma Ajax 4G", img: IMG + "ajax-ajhub4g-hq.webp" },
      { id: "ajax-bkeypadtouch", name: "Teclado táctil inalámbrico", img: IMG + "ajax-bkeypadtouch-hq.webp" },
      { id: "ajax-bfireprotect2rb", name: "Sensor de humo y calor", img: IMG + "ajax-bfireprotect2rb-hq.webp" },
    ],
  },
  {
    id: "controla",
    kicker: "Controla",
    title: "Tú decides quién entra",
    text: "Control de acceso con huella, rostro o tarjeta, control de asistencia, videoporteros y cerraduras electromagnéticas.",
    points: ["Reconocimiento facial y huella", "Videoportero con monitor", "Cerraduras para cualquier puerta"],
    brands: "ZKTeco · Dahua · CDVI · Enforcer",
    cta: { label: "Ver control de acceso", to: groupCatalogUrl("acceso") },
    color: "#8b7cff",
    products: [
      { id: "zkteco-horustl2", name: "Acceso facial ZKTeco", img: IMG + "zkteco-horustl2-hq.webp" },
      { id: "dahua-vth2421fbp", name: "Monitor de videoportero", img: IMG + "dahua-vth2421fbp-hq.webp" },
      { id: "enforcer-e941da600q", name: "Cerradura electromagnética", img: IMG + "enforcer-e941da600q-hq.webp" },
    ],
  },
  {
    id: "conecta",
    kicker: "Conecta",
    title: "Una red estable que no se apaga",
    text: "Switches, routers y puntos de acceso Wi-Fi, gabinetes y cableado, más UPS y reguladores para que todo siga funcionando.",
    points: ["Wi-Fi para interiores y exteriores", "Switches PoE para cámaras", "Respaldo de energía (UPS)"],
    brands: "Reyee · TP-Link · TRENDnet · CDP",
    cta: { label: "Ver redes y energía", to: groupCatalogUrl("redes") },
    color: "#4f9dff",
    products: [
      { id: "reyee-rgrap6262g", name: "Access point Wi-Fi 6 exterior", img: IMG + "reyee-rgrap6262g-hq.webp" },
      { id: "reyee-rgew1300g", name: "Router Gigabit doble banda", img: IMG + "reyee-rgew1300g-hq.webp" },
      { id: "cdp-cd00028", name: "UPS con regulador", img: IMG + "cdp-cd00028-hq.webp" },
    ],
  },
  {
    id: "equipate",
    kicker: "Equípate",
    title: "Las herramientas para hacerlo bien",
    text: "Herramientas manuales, eléctricas e inalámbricas, accesorios y equipo de protección para el trabajo de todos los días.",
    points: ["Inalámbricas de 12 V y 20 V", "Manuales y de medición", "Equipo de protección personal"],
    brands: "Tolsen",
    cta: { label: "Ver herramientas", to: groupCatalogUrl("herramientas") },
    color: "#ffc24a",
    products: [
      { id: "tolsen-87415", name: "Kit de taladros 20 V", img: IMG + "tolsen-87415-hq2.webp" },
      { id: "tolsen-79213", name: "Atornillador 12 V", img: IMG + "tolsen-79213-hq2.webp" },
      { id: "tolsen-45083", name: "Orejeras de protección", img: IMG + "tolsen-45083-hq2.webp" },
    ],
  },
];
