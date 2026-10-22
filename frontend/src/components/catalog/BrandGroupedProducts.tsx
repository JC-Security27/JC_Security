import type { Product } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

/* Agrupa productos por marca y los muestra en secciones. Los productos sin
   marca (p. ej. servicios) van en un grupo "Otros". Cumple el requisito del
   brief de agrupar visualmente por marca dentro de una categoría. */
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

  // Si solo hay un grupo, no mostramos encabezado de marca.
  if (order.length <= 1) {
    return (
      <div className="grid grid-cards">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  return (
    <div className="brand-groups">
      {order.map((brand) => (
        <section key={brand} className="brand-group">
          <div className="brand-group-head">
            <h3>{brand}</h3>
            <span className="muted">
              {groups.get(brand)!.length} producto(s)
            </span>
          </div>
          <div className="grid grid-cards">
            {groups.get(brand)!.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
