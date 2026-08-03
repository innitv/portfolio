import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { SiteFooter, SiteHeader } from "./site-chrome"
import { PortfolioStoryCanvas } from "./story-canvas"

/**
 * Шапка и футер.
 *
 * Крошки отдельным компонентом больше не существуют — с 2026-08-03 они и есть
 * шапка: одна цепочка «Иван Игнатов · А3 · Редизайн главной». Поэтому истории
 * шапки перечисляют длину цепочки как состояние.
 *
 * Отдельная история на цель нажатия существует потому, что дефект был именно
 * здесь: текстовые кнопки без паддинга давали высоту строки — 20 px против
 * минимума 24 по WCAG 2.5.8 и практических 44 для пальца.
 */
const meta = {
  title: "Portfolio/SiteChrome",
} satisfies Meta

export default meta

type Story = StoryObj

/** Второй уровень: страница компании. */
export const HeaderTwoLevels: Story = {
  render: () => (
    <PortfolioStoryCanvas width={1264}>
      <SiteHeader current="А3" onHome={fn()} />
    </PortfolioStoryCanvas>
  ),
}

/** Третий уровень: страница кейса — самая длинная цепочка на сайте. */
export const HeaderThreeLevels: Story = {
  render: () => (
    <PortfolioStoryCanvas width={1264}>
      <SiteHeader
        current="Редизайн главной"
        levels={[{ label: "А3", onClick: fn() }]}
        onHome={fn()}
      />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Главная: цепочка из одного звена.
 *
 * Имя здесь не ссылка — переход на текущую страницу был бы обещанием, которого
 * не будет. Проверка держит и это, и то, что контакта в шапке нет: до правки
 * 2026-08-03 он дублировался с подвалом.
 */
export const HeaderOnHome: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByTestId("pf-header-home")).toBeNull()
    await expect(canvas.getByTestId("pf-header-current")).toHaveTextContent("Иван Игнатов")
    await expect(canvas.queryByTestId("pf-contact-tg")).toBeNull()
  },
  render: () => (
    <PortfolioStoryCanvas width={1264}>
      <SiteHeader />
    </PortfolioStoryCanvas>
  ),
}

export const Footer: Story = {
  render: () => (
    <PortfolioStoryCanvas width={1264}>
      <SiteFooter onContact={fn()} suffix="А3" />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Подвал страницы кейса: без блока контакта.
 *
 * Там контакт держит липкая правая колонка, и второй такой же блок внизу
 * вернул бы дубль внутри одной страницы — тот самый, ради которого контакты
 * убирались из шапки.
 */
export const FooterWithoutContact: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByTestId("pf-footer-tg")).toBeNull()
  },
  render: () => (
    <PortfolioStoryCanvas width={1264}>
      <SiteFooter contact={false} suffix="А3" />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Цель нажатия на тач-ширине.
 *
 * Проверяется измерением, а не глазами: 44 px набраны паддингом, кегль
 * остаётся интерфейсным 14/20. История задаёт узкую ширину, потому что
 * компактная высота включается только от `sm`.
 */
export const TapTargets: Story = {
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    const small = [...canvasElement.querySelectorAll("a,button")]
      .map((node) => ({
        label: node.textContent?.slice(0, 20) ?? "",
        height: Math.round(node.getBoundingClientRect().height),
      }))
      .filter((item) => item.height < 44)
    await expect(small).toEqual([])
  },
  render: () => (
    <PortfolioStoryCanvas width={390}>
      <SiteHeader
        current="Редизайн главной"
        levels={[{ label: "А3", onClick: fn() }]}
        onHome={fn()}
      />
      <SiteFooter onContact={fn()} />
    </PortfolioStoryCanvas>
  ),
}
