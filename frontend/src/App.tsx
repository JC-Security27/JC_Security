import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/CatalogPage";
import { CategoryPage } from "@/pages/CategoryPage";
import { ProductPage } from "@/pages/ProductPage";
import { QuotePage } from "@/pages/QuotePage";
import { SocialPage } from "@/pages/SocialPage";
import { GuidesPage } from "@/pages/GuidesPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/categoria/:slug" element={<CategoryPage />} />
        <Route path="/producto/:id" element={<ProductPage />} />
        <Route path="/cotizacion" element={<QuotePage />} />
        <Route path="/redes" element={<SocialPage />} />
        <Route path="/guias" element={<GuidesPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        {/* Redirección para no romper enlaces antiguos */}
        <Route path="/proyectos" element={<Navigate to="/servicios" replace />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
