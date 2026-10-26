import { useState } from "react";
import type { ProductImage as ProductImageType } from "@/types/catalog";

/* ==========================================================================
   Imagen de producto robusta.
   -------------------------------------------------------------------------
   REGLA DE IMÁGENES (aplica a las fotos actuales y a las que se agreguen):
   - La foto SIEMPRE se muestra completa (object-fit: contain, vía CSS del
     contenedor), centrada sobre fondo blanco, sin recortarse ni deformarse,
     sin importar la proporción real del archivo (muy alto, ancho o cuadrado).
   - Si la imagen no carga (URL rota, archivo faltante), en vez de un ícono de
     "imagen rota" se muestra un placeholder prolijo "Sin imagen".

   Se renderiza SOLO el <img> (o el placeholder), para colocarse dentro del
   contenedor .product-card-media / .product-detail-media que ya existe.
   Al usarlo en todas las tarjetas y en el detalle, cualquier imagen nueva
   queda cubierta por esta regla automáticamente.
   ========================================================================== */
export function ProductImage({
  image,
  alt,
}: {
  image: ProductImageType | undefined;
  /** Texto alternativo; cae al alt de la imagen si no se pasa. */
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return <span className="product-card-noimg">Sin imagen</span>;
  }

  return (
    <img
      src={image.url}
      alt={alt ?? image.alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
