import * as React from "react"

import { ShadcnThemeScope } from "@/components/shadcn/theme-scope"
import { cn } from "@/lib/utils"

/**
 * Полотно историй портфолио.
 *
 * Тема `portfolio` и фон страницы — общие для всех историй раздела: без них
 * компонент рендерился бы на канве Storybook, то есть на чужой поверхности, и
 * ни контраст, ни приглушённые тона нельзя было бы сравнивать с тем, что видит
 * человек в роуте.
 *
 * Ширина задаётся историей: часть компонентов (карточки, строка метрик,
 * степпер) осмысленна только в ширине контейнера сайта.
 */
export function PortfolioStoryCanvas({
  children,
  className,
  width,
}: {
  children: React.ReactNode
  className?: string
  width?: number
}) {
  return (
    <ShadcnThemeScope className={cn("bg-background p-6", className)} theme="portfolio">
      <div style={{ maxWidth: width, width: width ? "100%" : undefined }}>{children}</div>
    </ShadcnThemeScope>
  )
}
