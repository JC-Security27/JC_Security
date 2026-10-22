import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* Lleva el scroll al inicio al cambiar de ruta. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
