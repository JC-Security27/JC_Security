import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AiChatWidget } from "@/components/ai/AiChatWidget";
import { BackToTop } from "@/components/ui/BackToTop";
import { CornerWebs } from "./SeasonDecor";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      <CornerWebs />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
      <AiChatWidget />
    </>
  );
}
