import { siteConfig } from "@/config/site";
import { seasonLogoSrc } from "@/config/seasons";

/* Logo oficial de JC Security (JCsecurity_Logo.png del usuario, 2026-10-27):
   monograma "JC" + "SECURITY". Es blanco con fondo transparente.
   - Encabezado: siempre blanco (el header es azul marino en ambos temas).
   - `adaptive` (pie de página): blanco en tema oscuro y azul marino en tema
     claro, porque ahí el fondo cambia con el tema. */
export function Logo({
  adaptive = false,
  original = false,
}: {
  adaptive?: boolean;
  /** true: siempre el logo original, aunque haya temporada (pie de página,
   *  pedido del usuario 2026-10-29). */
  original?: boolean;
}) {
  // En temporada se usa el logo de la celebración (el sitio es solo oscuro).
  const seasonal = original ? null : seasonLogoSrc();
  if (seasonal) {
    return (
      <span className="logo" role="img" aria-label={siteConfig.name}>
        <img src={seasonal} alt="" className="logo-img logo-img--season" />
      </span>
    );
  }
  return (
    <span className="logo" role="img" aria-label={siteConfig.name}>
      <img
        src="/logo-jc-security.png"
        alt=""
        className={`logo-img ${adaptive ? "logo-img--on-dark" : ""}`}
        width={784}
        height={138}
      />
      {adaptive && (
        <img
          src="/logo-jc-security-navy.png"
          alt=""
          className="logo-img logo-img--on-light"
          width={784}
          height={138}
        />
      )}
    </span>
  );
}
