import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Franja con parallax dinámico: cada capa marcada con data-speed se desplaza a
 * otra velocidad que el scroll (fondo más lento, íconos a distintos ritmos y
 * algunos en sentido contrario). Sin librerías: requestAnimationFrame + transform,
 * solo mientras la franja está en pantalla. Con "reducir movimiento" queda estática.
 */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(
      section.querySelectorAll<HTMLElement>("[data-speed]")
    ).map((el) => ({ el, speed: Number(el.dataset.speed) || 0 }));

    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      // Distancia del centro de la franja al centro de la pantalla.
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      for (const { el, speed } of layers) {
        el.style.transform = `translate3d(0, ${(-offset * speed).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) onScroll();
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
const floating = [
  { icon: "camera", top: "12%", left: "6%", size: 64, speed: 0.25 },
  { icon: "shield", top: "62%", left: "14%", size: 48, speed: -0.15 },
  { icon: "lock", top: "18%", left: "84%", size: 56, speed: 0.35 },
  { icon: "wifi", top: "70%", left: "78%", size: 60, speed: -0.2 },
  { icon: "bell", top: "40%", left: "92%", size: 40, speed: 0.12 },
  { icon: "tool", top: "84%", left: "32%", size: 44, speed: -0.3 },
];

export function ParallaxBand() {
  const ref = useParallax<HTMLElement>();

  return (
    <section ref={ref} className="parallax-band" aria-labelledby="parallax-title">
      <div className="parallax-bg" data-speed="0.4" aria-hidden="true" />
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
            <strong>+1.600</strong>
            <span>productos</span>
          </li>
          <li>
            <strong>+30</strong>
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
