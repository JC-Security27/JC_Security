import { useCallback, useEffect, useRef, useState } from "react";
import { ProductGroupCard } from "@/components/catalog/ProductGroupCard";
import type { ProductGroup } from "@/lib/variants";

/**
 * Fila horizontal de productos que se desliza a la izquierda y a la derecha
 * (pedido del usuario: productos relacionados en el detalle). Se mueve con el
 * dedo, la rueda/trackpad o las flechas; las tarjetas se acomodan solas
 * (scroll-snap). Las flechas se desactivan al llegar a cada extremo.
 */
export function ProductCarousel({ groups, label }: { groups: ProductGroup[]; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, groups]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={`carousel ${canPrev ? "can-prev" : ""} ${canNext ? "can-next" : ""}`}>
      <button
        type="button"
        className="carousel-btn carousel-btn--prev"
        onClick={() => move(-1)}
        disabled={!canPrev}
        aria-label="Ver anteriores"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="carousel-track" ref={track} role="region" aria-label={label} tabIndex={0}>
        {groups.map((g) => (
          <div className="carousel-item" key={g.representative.id}>
            <ProductGroupCard group={g} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="carousel-btn carousel-btn--next"
        onClick={() => move(1)}
        disabled={!canNext}
        aria-label="Ver siguientes"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
