import { useEffect, useState } from "react";

/**
 * Hook para responder a una media query de CSS desde React.
 * Ej: const isMobile = useMediaQuery("(max-width: 640px)");
 * Devuelve false en SSR / antes de montar, y se actualiza al cambiar el tamaño.
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sincroniza por si cambió entre el render y el efecto
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
