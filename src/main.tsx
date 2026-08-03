import React from "react";
import { createRoot } from "react-dom/client";

import { PortfolioRoute } from "@/views/PortfolioRoute";

// Стили подключаются здесь: раньше их импортировал `PortfolioView.tsx`,
// удалённый при переносе на shadcn/ui 2026-08-03.
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <PortfolioRoute />
  </React.StrictMode>,
);
