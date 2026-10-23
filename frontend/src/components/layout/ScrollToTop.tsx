import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* Lleva el scroll al inicio en cada navegación (abrir o cerrar algo), en todos
   los dispositivos. Reacciona tanto al cambio de ruta como al de parámetros de
   la URL (?categoria=..., etc.), y fuerza el scroll varias veces para ganarle
   a la restauración automática del navegador en móvil. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Desactiva la restauración automática de scroll del navegador (una vez).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const toTop = () => {
      // "instant" evita que el scroll-behavior: smooth haga un desplazamiento
      // largo y visible; queremos un salto directo al tope.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    toTop(); // inmediato
    const raf = requestAnimationFrame(toTop); // tras el primer pintado
    const t1 = setTimeout(toTop, 60); // red de seguridad en móvil
    const t2 = setTimeout(toTop, 180);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, search]);

  return null;
}
