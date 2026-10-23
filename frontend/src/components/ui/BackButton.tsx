import { useNavigate, useLocation } from "react-router-dom";

/* Botón "Volver". Regresa a la página anterior del historial. Si el usuario
   llegó directo (sin historial previo, p. ej. abriendo un enlace), cae a una
   ruta de respaldo (por defecto el catálogo). */
export function BackButton({
  fallback = "/catalogo",
  label = "Volver",
}: {
  fallback?: string;
  label?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // location.key === "default" => no hay historial dentro de la app.
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button type="button" className="back-btn" onClick={handleClick}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M15 5 L8 12 L15 19"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
