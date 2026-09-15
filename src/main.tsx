import React from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";

import { PortfolioRoute } from "@/views/PortfolioRoute";

// Стили подключаются здесь: раньше их импортировал `PortfolioView.tsx`,
// удалённый при переносе на shadcn/ui 2026-08-03.
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

/*
 * 🔴 Возможности движения грузятся НАБОРОМ, а не пакетом целиком.
 *
 * `domAnimation` — это анимации, варианты, выход и жесты; перетаскивания и
 * layout-анимаций на сайте нет, и платить за них 14.6 КБ gzip не за что.
 * `strict` запрещает компоненты `motion.*`: с ними набор грузится весь, и
 * экономия пропадает молча. Поэтому по проекту используется `m.*`.
 */
createRoot(rootElement).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation} strict>
      <PortfolioRoute />
    </LazyMotion>
  </React.StrictMode>,
);
