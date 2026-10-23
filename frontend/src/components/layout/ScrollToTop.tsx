import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* Lleva el scroll al inicio en cada cambio de ruta, incluido al usar el botón
   "Volver". Por defecto el navegador restaura la posición anterior al navegar
   en el historial; lo desactivamos para que siempre arranque arriba. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  // Desactiva la restauración automática de scroll del navegador (una vez).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Forzamos el scroll arriba en el siguiente frame, para ganarle a la
    // restauración del navegador en móvil.
    const toTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    toTop();
    const id = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
