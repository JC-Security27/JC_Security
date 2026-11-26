import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BackToTop } from "@/components/ui/BackToTop";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
    </>
  );
}
