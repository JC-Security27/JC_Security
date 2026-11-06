import { groupCatalogUrl } from "@/lib/categoryGroups";

/* ==========================================================================
   Guías de seguridad (pedido del usuario, 2026-11-02): contenido general y
   temporal, armado con lo que ya tiene el sitio (servicios y catálogo), para
   que la sección no quede vacía. Sin precios, garantías ni datos inventados
   de la empresa. Cuando JC Security mande sus guías, se reemplazan aquí.

   `image`: nombre base de las fotos de public/servicios/ (480/800/1200).
   Sin foto, la tarjeta muestra `icon` sobre el color de la temporada.
   ========================================================================== */

export type GuideIcon = "building" | "flame" | "battery";

export interface GuideSection {
  title: string;
  text?: string;
  items?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  minutes: number;
  image?: string;
  imagePosition?: string;
  icon?: GuideIcon;
  sections: GuideSection[];
  related: { label: string; to: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "seguridad-en-el-hogar",
    title: "Seguridad en el hogar: por dónde empezar",
    tag: "Hogar",
    summary:
      "Revisa los puntos débiles de tu casa y combina varias capas de " +
      "protección: iluminación, cámaras, alarma y buenos hábitos.",
    minutes: 4,
    image: "automatizacion",
    sections: [
      {
        title: "Revisa los puntos de entrada",
        text:
          "La mayoría de las entradas forzadas ocurren por puertas, ventanas " +
          "y portones. Recorre tu casa como lo haría un extraño y anota lo " +
          "que encuentres:",
        items: [
          "Puertas principales y traseras: cerraduras de buena calidad y marcos firmes.",
          "Ventanas a nivel de la calle o que dan a patios y lotes baldíos.",
          "Portones y cocheras: que cierren bien y no queden abiertos.",
          "Muros y tapias fáciles de escalar.",
        ],
      },
      {
        title: "Ilumina el exterior",
        items: [
          "Luces con sensor de movimiento en entradas, patios y cochera.",
          "Evita zonas oscuras junto a puertas y ventanas.",
          "Usa temporizadores o luces inteligentes cuando no estés en casa.",
        ],
      },
      {
        title: "Combina capas de protección",
        text:
          "Ningún equipo por sí solo es suficiente. Lo ideal es combinar " +
          "varios según tu casa y tu presupuesto:",
        items: [
          "Cámaras para ver y grabar lo que pasa, también desde el celular.",
          "Alarma con sensores en puertas y ventanas y aviso al celular.",
          "Cerca eléctrica en el perímetro.",
          "Cerraduras inteligentes o control de acceso.",
        ],
      },
      {
        title: "Buenos hábitos",
        items: [
          "No publiques en redes sociales cuándo sales de viaje.",
          "Cambia las contraseñas que traen los equipos de fábrica.",
          "Revisa una vez al mes que todo funcione.",
          "Ten a mano el número de emergencias: 911.",
        ],
      },
    ],
    related: [
      { label: "Cámaras y videovigilancia", to: groupCatalogUrl("camaras") },
      { label: "Alarmas", to: groupCatalogUrl("alarmas") },
      { label: "Control de acceso", to: groupCatalogUrl("acceso") },
      { label: "Servicio de automatización inteligente", to: "/servicios" },
    ],
  },
  {
    slug: "como-elegir-camaras",
    title: "Cómo elegir cámaras de seguridad",
    tag: "Cámaras",
    summary:
      "IP o HDCVI, resolución, visión nocturna, exterior o interior y " +
      "grabación: lo que conviene revisar antes de comprar.",
    minutes: 5,
    image: "camaras",
    imagePosition: "center 30%",
    sections: [
      {
        title: "IP o analógicas (HDCVI)",
        text:
          "Las cámaras IP envían la imagen por la red y se conectan a un " +
          "grabador NVR o al router; ofrecen más resolución y funciones " +
          "inteligentes. Las HDCVI usan cable coaxial y un grabador DVR: son " +
          "una buena opción para aprovechar un cableado existente o para un " +
          "presupuesto más ajustado.",
      },
      {
        title: "Resolución y lente",
        items: [
          "2 MP (1080p) alcanza para ver lo que pasa en un área cercana.",
          "4 MP o más para distinguir rostros o placas con más detalle.",
          "Lente de 2.8 mm (ángulo amplio) para patios y salas; 6 mm o varifocal para ver más lejos.",
        ],
      },
      {
        title: "Visión nocturna",
        items: [
          "Infrarrojo: imagen en blanco y negro aun en total oscuridad.",
          "Full color o luz cálida: imagen a color de noche con poca luz.",
          "Revisa hasta qué distancia llega la visión nocturna según el área.",
        ],
      },
      {
        title: "Exterior o interior",
        items: [
          "Para exteriores, busca protección IP67 contra polvo y lluvia.",
          "Tipo bala (bullet): se ve de lejos y disuade. Tipo domo: más discreta y resistente a golpes.",
          "Colócalas fuera del alcance de la mano y sin el sol directo en el lente.",
        ],
      },
      {
        title: "Grabación y acceso desde el celular",
        items: [
          "El grabador (NVR o DVR) necesita un disco duro: a más cámaras y resolución, más capacidad para guardar los días que necesitas.",
          "Revisa que tenga app para ver en vivo y recibir alertas.",
          "Algunas cámaras graban en una tarjeta microSD, sin grabador.",
        ],
      },
    ],
    related: [
      { label: "Cámaras y videovigilancia", to: groupCatalogUrl("camaras") },
      { label: "Servicio de instalación de cámaras", to: "/servicios" },
    ],
  },
  {
    slug: "mantenimiento-de-camaras",
    title: "Mantenimiento de cámaras: lista rápida",
    tag: "Cámaras",
    summary:
      "Revisiones sencillas para que tus cámaras graben bien cuando más " +
      "las necesitas.",
    minutes: 3,
    image: "mantenimiento",
    imagePosition: "center 30%",
    sections: [
      {
        title: "Cada mes",
        items: [
          "Revisa que todas las cámaras se vean en la app y en el grabador.",
          "Reproduce una grabación para confirmar que guarda bien.",
          "Verifica la fecha y la hora: son importantes si necesitas una grabación como evidencia.",
        ],
      },
      {
        title: "Cada tres a seis meses",
        items: [
          "Limpia el lente con un paño de microfibra seco o apenas húmedo, sin productos abrasivos.",
          "Quita telarañas, nidos y ramas que tapen la vista o causen alertas falsas.",
          "Revisa cables, conectores y cajas de paso por humedad o daños.",
          "Revisa el estado del disco duro del grabador.",
        ],
      },
      {
        title: "Seguridad digital",
        items: [
          "Cambia la contraseña de fábrica por una propia y segura.",
          "Mantén actualizado el firmware de cámaras y grabador.",
          "No compartas el usuario principal: crea usuarios aparte para cada persona.",
        ],
      },
      {
        title: "Cuándo llamar a un técnico",
        items: [
          "La imagen sale con rayas, borrosa o se apaga de noche.",
          "El grabador se reinicia solo o deja de grabar.",
          "Una cámara se desconecta seguido o tiene humedad por dentro.",
        ],
      },
    ],
    related: [
      { label: "Servicio de mantenimiento y soporte técnico", to: "/servicios" },
      { label: "Cámaras y videovigilancia", to: groupCatalogUrl("camaras") },
    ],
  },
  {
    slug: "cerca-electrica",
    title: "Cerca eléctrica: lo que debes saber",
    tag: "Perímetro",
    summary:
      "Cómo funciona, qué necesita una instalación segura y cómo " +
      "mantenerla en buen estado.",
    minutes: 3,
    image: "cerca-electrica",
    imagePosition: "center 35%",
    sections: [
      {
        title: "Cómo funciona",
        text:
          "Un energizador envía pulsos de alto voltaje y muy corta duración " +
          "por los hilos. Quien la toca recibe una descarga que lo hace " +
          "retroceder, y muchos sistemas pueden activar una alarma si un hilo " +
          "se corta o hace contacto con tierra.",
      },
      {
        title: "Para una instalación segura",
        items: [
          "Un buen sistema de tierra con varillas adecuadas.",
          "Aisladores en cada poste para evitar fugas.",
          "Rótulos de advertencia visibles a lo largo de la cerca.",
          "Altura y ubicación fuera del alcance de niños y de los vecinos.",
          "Instalación por personal calificado y según la normativa vigente.",
        ],
      },
      {
        title: "Mantenimiento",
        items: [
          "Mantén ramas y plantas lejos de los hilos: causan fugas y falsas alarmas.",
          "Revisa que los hilos estén tensos y que no haya aisladores rotos.",
          "Prueba el energizador y la alarma periódicamente.",
          "Revisa la batería de respaldo para que funcione en un apagón.",
        ],
      },
    ],
    related: [
      { label: "Servicio de instalación de cerca eléctrica", to: "/servicios" },
      { label: "Alarmas", to: groupCatalogUrl("alarmas") },
    ],
  },
  {
    slug: "electricidad-segura",
    title: "Señales de que tu instalación eléctrica necesita revisión",
    tag: "Electricidad",
    summary:
      "Breakers que se disparan, tomacorrientes calientes u olor a " +
      "quemado: cuándo conviene una inspección eléctrica.",
    minutes: 4,
    image: "inspeccion-electrica",
    sections: [
      {
        title: "Señales de alerta",
        items: [
          "Breakers que se disparan seguido.",
          "Tomacorrientes o apagadores calientes, flojos o con marcas de quemado.",
          "Luces que parpadean o bajan de intensidad.",
          "Olor a quemado o zumbidos en el tablero.",
          "Chispazos al conectar algo o descargas al tocar un electrodoméstico.",
        ],
      },
      {
        title: "Hábitos que ayudan",
        items: [
          "No sobrecargues las regletas ni conectes una regleta en otra.",
          "Usa cables y extensiones del calibre adecuado para cada equipo.",
          "No tapes el tablero ni guardes cosas encima o debajo de él.",
          "Desconecta los equipos sensibles durante tormentas eléctricas.",
        ],
      },
      {
        title: "Cuándo pedir una inspección",
        items: [
          "Si tu casa o local lleva varios años sin una revisión.",
          "Antes de comprar o alquilar una propiedad.",
          "Al agregar aire acondicionado, ducha eléctrica u otro equipo de alto consumo.",
          "Después de una remodelación o de un corto circuito.",
          "Si te piden una certificación eléctrica para un trámite.",
        ],
      },
    ],
    related: [
      { label: "Servicio de inspección de instalaciones eléctricas", to: "/servicios" },
      { label: "Servicio de certificación eléctrica", to: "/servicios" },
      { label: "Servicio de planos eléctricos", to: "/servicios" },
    ],
  },
  {
    slug: "red-wifi-segura",
    title: "Wi-Fi y red segura para tus cámaras",
    tag: "Redes",
    summary:
      "Configura el router, mejora la cobertura y protege tus cámaras y " +
      "equipos inteligentes conectados a internet.",
    minutes: 4,
    image: "redes",
    sections: [
      {
        title: "Configura bien el router",
        items: [
          "Cambia el usuario y la contraseña de administrador que trae de fábrica.",
          "Usa cifrado WPA2 o WPA3 y una contraseña larga.",
          "Crea una red de invitados para las visitas.",
        ],
      },
      {
        title: "Mejora la cobertura",
        items: [
          "Ubica el router en un punto central y elevado, lejos de paredes gruesas.",
          "En casas grandes o de dos pisos, usa puntos de acceso o un sistema de malla.",
          "Conecta por cable las cámaras y el grabador cuando se pueda: es más estable que el Wi-Fi.",
        ],
      },
      {
        title: "Cámaras y equipos inteligentes",
        items: [
          "Cambia sus contraseñas de fábrica.",
          "Mantén el firmware al día.",
          "Desactiva funciones que no uses, como el acceso remoto o UPnP.",
        ],
      },
    ],
    related: [
      { label: "Redes y cableado", to: groupCatalogUrl("redes") },
      { label: "Servicio de instalación de redes", to: "/servicios" },
    ],
  },
  {
    slug: "seguridad-para-negocios",
    title: "Seguridad para negocios",
    tag: "Negocios",
    summary:
      "Qué vigilar, cómo controlar quién entra y cómo mantener todo " +
      "funcionando aun sin electricidad.",
    minutes: 4,
    image: "seguridad-negocios",
    icon: "building",
    sections: [
      {
        title: "Puntos clave a vigilar",
        items: [
          "Entradas y salidas, incluidas las de servicio.",
          "Caja y zonas donde se maneja dinero.",
          "Bodega, mercadería y parqueo.",
        ],
      },
      {
        title: "Control de acceso",
        items: [
          "Tarjeta, huella o reconocimiento facial en lugar de llaves.",
          "Registro de quién entra y a qué hora.",
          "Cuando alguien deja de trabajar contigo, quitas su acceso sin cambiar cerraduras.",
        ],
      },
      {
        title: "Alarmas y respaldo",
        items: [
          "Alarma con sensores y aviso a los celulares de los responsables.",
          "Detección de incendio en bodegas y cocinas.",
          "UPS para el grabador, el router y el control de acceso.",
        ],
      },
      {
        title: "Procedimientos",
        items: [
          "Define quién abre, quién cierra y quién activa la alarma.",
          "Revisa las grabaciones cuando haya faltantes o incidentes.",
          "Evita acumular efectivo en el local.",
        ],
      },
    ],
    related: [
      { label: "Control de acceso", to: groupCatalogUrl("acceso") },
      { label: "Cámaras y videovigilancia", to: groupCatalogUrl("camaras") },
      { label: "Alarmas e incendio", to: groupCatalogUrl("alarmas") },
    ],
  },
  {
    slug: "deteccion-de-incendio",
    title: "Detección de incendio en casa y en el negocio",
    tag: "Incendio",
    summary:
      "Dónde colocar los detectores, cómo probarlos y qué tener listo " +
      "para una emergencia.",
    minutes: 3,
    image: "incendio",
    icon: "flame",
    sections: [
      {
        title: "Dónde colocar los detectores",
        items: [
          "Detectores de humo en los pasillos cerca de los dormitorios y en cada piso.",
          "En el techo, lejos de las esquinas, de ventiladores y de aires acondicionados.",
          "En la cocina, un detector de calor: el de humo da falsas alarmas al cocinar.",
        ],
      },
      {
        title: "Pruebas y mantenimiento",
        items: [
          "Prueba cada detector una vez al mes con su botón.",
          "Cambia las baterías como indica el fabricante.",
          "Reemplaza el detector cuando termine su vida útil, indicada en el equipo.",
        ],
      },
      {
        title: "Ten un plan",
        items: [
          "Un extintor a mano, vigente y que todos sepan usar.",
          "Una ruta de salida conocida por toda la familia o el personal.",
          "En una emergencia, llama al 911.",
        ],
      },
    ],
    related: [
      { label: "Alarmas e incendio", to: groupCatalogUrl("alarmas") },
    ],
  },
  {
    slug: "respaldo-de-energia",
    title: "Respaldo de energía para tus equipos de seguridad",
    tag: "Energía",
    summary:
      "Un apagón deja sin cámaras ni alarma justo cuando más se " +
      "necesitan. Así eliges una UPS.",
    minutes: 3,
    image: "respaldo-energia",
    icon: "battery",
    sections: [
      {
        title: "¿Por qué tener respaldo?",
        text:
          "Los apagones y las variaciones de voltaje no solo apagan los " +
          "equipos: también pueden dañarlos. Una UPS mantiene todo " +
          "funcionando un tiempo y protege contra picos.",
      },
      {
        title: "Qué conectar a la UPS",
        items: [
          "El grabador de las cámaras.",
          "El router y el switch, para seguir viendo las cámaras desde el celular.",
          "La fuente de poder de las cámaras.",
          "El control de acceso (el panel de alarma suele traer su propia batería).",
        ],
      },
      {
        title: "Cómo elegir",
        items: [
          "Suma el consumo en vatios de los equipos y deja un margen.",
          "Define cuánto tiempo necesitas de respaldo.",
          "Prefiere modelos con regulador de voltaje.",
          "Las baterías se desgastan: revísalas y reemplázalas cada cierto tiempo.",
        ],
      },
    ],
    related: [
      { label: "Energía (UPS, fuentes y baterías)", to: groupCatalogUrl("energia") },
      { label: "Servicio de mantenimiento y soporte técnico", to: "/servicios" },
    ],
  },
];

export function getGuide(slug: string | undefined): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
