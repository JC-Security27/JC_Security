import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { STORY, YEARS_OF_EXPERIENCE, type StoryChapter } from "@/components/home/homeStory";

/**
 * Historia con scroll (scrollytelling): en computadora, a la izquierda van los
 * capítulos (Vigila, Detecta, Controla, Conecta, Equípate) y a la derecha un
 * escenario de vidrio fijo que cambia de productos y de color según el
 * capítulo que se está leyendo. En celular cada capítulo lleva sus fotos.
 */
function Scene({ chapter, active }: { chapter: StoryChapter; active: boolean }) {
  const [main, a, b] = chapter.products;
  return (
    <div className={`story-scene ${active ? "is-active" : ""}`} aria-hidden={!active}>
      <Link to={`/producto/${main.id}`} className="story-card glass story-card--main" tabIndex={active ? 0 : -1}>
        <img src={main.img} alt={main.name} loading="lazy" />
        <span>{main.name}</span>
      </Link>
      <Link to={`/producto/${a.id}`} className="story-card glass story-card--a" tabIndex={active ? 0 : -1}>
        <img src={a.img} alt={a.name} loading="lazy" />
        <span>{a.name}</span>
      </Link>
      <Link to={`/producto/${b.id}`} className="story-card glass story-card--b" tabIndex={active ? 0 : -1}>
        <img src={b.img} alt={b.name} loading="lazy" />
        <span>{b.name}</span>
      </Link>
    </div>
  );
}

export function StoryScroll() {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);

  // El capítulo activo es el que cruza la franja central de la pantalla.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const goTo = (i: number) =>
    steps.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });

  const color = STORY[active].color;

  return (
    <section className="story" style={{ "--story-color": color } as CSSProperties} aria-labelledby="story-title">
      <div className="container">
        <header className="story-head">
          <span className="eyebrow">Todo para tu seguridad</span>
          <h2 id="story-title">
            {YEARS_OF_EXPERIENCE} años cuidando lo que más te importa
          </h2>
          <p>
            Desde la cámara hasta la herramienta para instalarla: así te
            acompañamos, paso a paso.
          </p>
        </header>

        <div className="story-layout">
          <div className="story-steps">
            {STORY.map((ch, i) => (
              <article
                key={ch.id}
                ref={(el) => {
                  steps.current[i] = el;
                }}
                data-index={i}
                className={`story-step glass ${i === active ? "is-active" : ""}`}
                style={{ "--c": ch.color } as CSSProperties}
              >
                <span className="story-kicker">
                  <span className="story-num">0{i + 1}</span> {ch.kicker}
                </span>
                <h3>{ch.title}</h3>
                <p>{ch.text}</p>
                <ul className="story-points">
                  {ch.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <p className="story-brands">{ch.brands}</p>
                {/* En celular, las fotos van dentro del capítulo */}
                <div className="story-step-media" aria-hidden="true">
                  {ch.products.map((p) => (
                    <img key={p.id} src={p.img} alt="" loading="lazy" />
                  ))}
                </div>
                <Link to={ch.cta.to} className="btn btn-primary btn-sm story-cta">
                  {ch.cta.label} →
                </Link>
              </article>
            ))}
          </div>

          <div className="story-stage-wrap">
            <div className="story-stage glass">
              <span className="story-glow" aria-hidden="true" />
              {STORY.map((ch, i) => (
                <Scene key={ch.id} chapter={ch} active={i === active} />
              ))}
              <nav className="story-progress" aria-label="Capítulos">
                {STORY.map((ch, i) => (
                  <button
                    key={ch.id}
                    type="button"
                    className={i === active ? "is-active" : ""}
                    onClick={() => goTo(i)}
                    aria-current={i === active ? "step" : undefined}
                  >
                    {ch.kicker}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
