import type { ReactNode } from "react";

/* ==========================================================================
   Estados reutilizables: carga, error y vacío.
   Cubren los estados que pide el brief de forma consistente en todo el sitio.
   ========================================================================== */

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

/** Skeleton de tarjetas para listados. */
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cards" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="state state-error" role="alert">
      <h3>No se pudo cargar la información</h3>
      <p>
        {error?.message
          ? error.message
          : "Ocurrió un problema al obtener los datos."}
      </p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Sin resultados",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="state state-empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Aviso de contenido de muestra / pendiente, para no confundir con real. */
export function SampleNotice({ children }: { children: ReactNode }) {
  return (
    <div className="notice" role="note">
      <span aria-hidden="true">⚠️</span>
      <span>{children}</span>
    </div>
  );
}
