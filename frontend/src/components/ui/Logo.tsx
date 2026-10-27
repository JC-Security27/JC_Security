import { siteConfig } from "@/config/site";

/* Logo oficial de JC Security (JCsecurity_Logo.png del usuario, 2026-10-27):
   monograma "JC" + "SECURITY". Es blanco con fondo transparente.
   - Encabezado: siempre blanco (el header es azul marino en ambos temas).
   - `adaptive` (pie de página): blanco en tema oscuro y azul marino en tema
     claro, porque ahí el fondo cambia con el tema. */
export function Logo({ adaptive = false }: { adaptive?: boolean }) {
  return (
    <span className="logo" role="img" aria-label={siteConfig.name}>
      <img
        src="/logo-jc-security.png"
        alt=""
        className={`logo-img ${adaptive ? "logo-img--on-dark" : ""}`}
        width={568}
        height={100}
      />
      {adaptive && (
        <img
          src="/logo-jc-security-navy.png"
          alt=""
          className="logo-img logo-img--on-light"
          width={568}
          height={100}
        />
      )}
    </span>
  );
}
