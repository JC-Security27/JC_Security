import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatPlus, useCatalogStats } from "@/lib/catalogStats";
import { CostaRicaNight } from "@/components/home/CostaRicaNight";

/**
 * Franja con parallax dinámico: cada capa marcada con data-speed se desplaza a
 * otra velocidad que el scroll (fondo y mapa más lentos, íconos a distintos
 * ritmos y algunos en sentido contrario). Sin librerías:
 * - Solo `transform: translate3d` (lo mueve la GPU, sin recalcular la página).
 * - Suavizado: las capas "persiguen" la posición del scroll con una
 *   interpolación, así el movimiento se ve fluido también en celulares, donde
 *   el scroll llega a saltos.
 * - Menos recorrido en pantallas chicas, donde el mapa va detrás del texto.
 * - Solo trabaja mientras la franja está en pantalla; fuera de ella además
 *   pausa las animaciones (clase `is-visible`), para ahorrar batería.
 * - Con "reducir movimiento" del sistema queda estática.
 */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layers = Array.from(
      section.querySelectorAll<HTMLElement>("[data-speed]")
    ).map((el) => ({ el, speed: Number(el.dataset.speed) || 0 }));

    let frame = 0;
    let visible = false;
    let current = 0; // desplazamiento suavizado
    let target = 0; // desplazamiento real según el scroll
    let intensity = 1;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      // Distancia del centro de la franja al centro de la pantalla.
      target = rect.top + rect.height / 2 - window.innerHeight / 2;
    };
    const apply = () => {
      for (const { el, speed } of layers) {
        const y = -current * speed * intensity;
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      }
    };
    const tick = () => {
      frame = 0;
      measure();
      const delta = target - current;
      // 0.14 por cuadro: alcanza el scroll en ~1/4 s, suave pero sin retraso molesto.
      current = Math.abs(delta) < 0.3 ? target : current + delta * 0.14;
      apply();
      if (current !== target && visible) frame = requestAnimationFrame(tick);
    };
    const request = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };
    const onResize = () => {
      const w = window.innerWidth;
      intensity = w <= 640 ? 0.55 : w <= 900 ? 0.75 : 1;
      measure();
      current = target; // al cambiar el tamaño, sin animar el salto
      apply();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        section.classList.toggle("is-visible", visible);
        request();
      },
      { rootMargin: "150px 0px" }
    );
    observer.observe(section);
    if (reduced) {
      return () => observer.disconnect();
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons: Record<string, ReactNode> = {
  camera: (
    <>
      <path d="M3 7h12l4 3v4l-4 3H3z" {...stroke} />
      <circle cx="9" cy="12" r="2.5" {...stroke} />
      <path d="M19 12h2" {...stroke} />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" {...stroke} />
      <path d="M9 12l2 2 4-4" {...stroke} />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" {...stroke} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" {...stroke} />
      <circle cx="12" cy="15" r="1.3" {...stroke} />
    </>
  ),
  wifi: (
    <>
      <path d="M3 9a13 13 0 0 1 18 0" {...stroke} />
      <path d="M6 12.5a8.5 8.5 0 0 1 12 0" {...stroke} />
      <path d="M9 16a4 4 0 0 1 6 0" {...stroke} />
      <circle cx="12" cy="19" r="0.8" {...stroke} />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...stroke} />
      <path d="M10 20a2 2 0 0 0 4 0" {...stroke} />
    </>
  ),
  tool: (
    <path
      d="M14.5 6.5a4 4 0 0 0 5 5l-8.5 8.5a2 2 0 0 1-3-3l8.5-8.5a4 4 0 0 0-2-2z"
      {...stroke}
    />
  ),
};

// Posición, tamaño y velocidad de cada ícono (velocidad negativa = sentido contrario).
// Van en la columna del texto y los bordes, para no tapar el mapa.
const floating = [
  { icon: "camera", top: "10%", left: "4%", size: 56, speed: 0.25 },
  { icon: "shield", top: "74%", left: "6%", size: 44, speed: -0.15 },
  { icon: "wifi", top: "84%", left: "40%", size: 48, speed: -0.2 },
];

export function ParallaxBand() {
  // Cifras reales del catálogo (mismo conteo que la página Catálogo).
  const stats = useCatalogStats();
  const ref = useParallax<HTMLElement>();

  return (
    <section ref={ref} className="parallax-band" aria-labelledby="parallax-title">
      <div className="parallax-bg" data-speed="0.4" aria-hidden="true" />
      {/* Costa Rica de noche (capa propia, se mueve más lento que el texto) */}
      <div className="parallax-map" data-speed="0.28" aria-hidden="true">
        <CostaRicaNight />
      </div>
      <div className="parallax-icons" aria-hidden="true">
        {floating.map((f) => (
          <svg
            key={f.icon}
            viewBox="0 0 24 24"
            className="parallax-icon"
            data-speed={f.speed}
            style={{ top: f.top, left: f.left, width: f.size, height: f.size }}
          >
            {icons[f.icon]}
          </svg>
        ))}
      </div>

      <div className="container parallax-content">
        <span className="eyebrow">Protección integral</span>
        <h2 id="parallax-title">Seguridad en cada capa</h2>
        <p>
          Cámaras, alarmas, control de acceso, redes y herramientas: todo lo que
          necesitas para proteger tu hogar o tu negocio, en un solo lugar.
        </p>
        <ul className="parallax-stats">
          <li>
            <strong>{stats ? formatPlus(stats.products) : "+1.500"}</strong>
            <span>productos</span>
          </li>
          <li>
            <strong>{stats ? formatPlus(stats.brands) : "+30"}</strong>
            <span>marcas</span>
          </li>
          <li>
            <strong>WhatsApp</strong>
            <span>asesoría directa</span>
          </li>
        </ul>
        <Link to="/catalogo" className="btn btn-primary">
          Ver catálogo
        </Link>
      </div>
    </section>
  );
}
