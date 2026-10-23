import type { Product } from "@/types/catalog";
import { ProductGroupCard } from "./ProductGroupCard";
import { groupByVariants } from "@/lib/variants";

/* Agrupa productos por marca y los muestra en secciones. Dentro de cada marca,
   las variantes de tamaño/talla se agrupan en una sola tarjeta. Los productos
   sin marca (p. ej. servicios) van en un grupo "Otros". */
export function BrandGroupedProducts({ products }: { products: Product[] }) {
  const groups = new Map<string, Product[]>();
  const order: string[] = [];

  for (const p of products) {
    const key = p.brandName ?? "Otros";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(p);
  }

  // Si solo hay un grupo de marca, no mostramos encabezado.
  if (order.length <= 1) {
    const variantGroups = groupByVariants(products);
    return (
      <div className="grid grid-cards">
        {variantGroups.map((g) => (
          <ProductGroupCard key={g.representative.id} group={g} />
        ))}
      </div>
    );
  }

  return (
    <div className="brand-groups">
      {order.map((brand) => {
        const variantGroups = groupByVariants(groups.get(brand)!);
        return (
          <section key={brand} className="brand-group">
            <div className="brand-group-head">
              <h3>{brand}</h3>
              <span className="muted">
                {variantGroups.length} producto(s)
              </span>
            </div>
            <div className="grid grid-cards">
              {variantGroups.map((g) => (
                <ProductGroupCard key={g.representative.id} group={g} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
