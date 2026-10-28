import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Preferencia de tema:
 * - "system": sigue prefers-color-scheme del dispositivo (por defecto).
 * - "light" / "dark": override manual elegido por la persona.
 */
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** Preferencia elegida (puede ser "system"). */
  preference: ThemePreference;
  /** Tema realmente aplicado ("light" | "dark"). */
  resolved: ResolvedTheme;
  /** Fija una preferencia explícita. */
  setPreference: (pref: ThemePreference) => void;
  /** Alterna entre claro y oscuro (sale del modo "system"). */
  toggle: () => void;
}

const STORAGE_KEY = "jcs-theme-preference";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * El sitio usa SOLO el tema oscuro (decisión del usuario, 2026-10-28): se
 * ignora la preferencia del dispositivo y cualquier elección guardada antes.
 * `index.html` ya trae data-theme="dark" para que no parpadee al cargar.
 * Se conserva la API del contexto por si se vuelve a habilitar el claro.
 */
const FORCED_THEME: ResolvedTheme = "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", FORCED_THEME);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento disponible: no importa */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference: FORCED_THEME,
      resolved: FORCED_THEME,
      setPreference: () => undefined,
      toggle: () => undefined,
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
