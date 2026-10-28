import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { QuoteProvider } from "./context/QuoteContext";
import "./styles/global.css";

// Si se publicó una versión nueva mientras la página estaba abierta, los
// archivos viejos ya no existen: se recarga una vez para tomar la nueva.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const key = "jcs-reloaded-at";
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 30_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QuoteProvider>
          <App />
        </QuoteProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
