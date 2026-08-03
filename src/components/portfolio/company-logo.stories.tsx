import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { CompanyLogo } from "./company-logo"
import { PortfolioStoryCanvas } from "./story-canvas"

/**
 * Три знака рядом — единственный способ проверить оптическую поправку высоты:
 * по отдельности каждый выглядит нормально, а в ряду сразу видно, что буквы
 * разной величины.
 */
const meta = {
  title: "Portfolio/CompanyLogo",
} satisfies Meta

export default meta

type Story = StoryObj

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Знак обязан оставаться монохромным: хроматики в интерфейсе нет вовсе,
    // цвет на странице принадлежит только скриншотам работ. Белое допускается
    // — это не цвет знака, а вырез внутри него (маска «Самолета») и заливка
    // clipPath, которая вообще не рисуется.
    const achromatic = new Set(["currentColor", "white", "#FFFFFF", "#ffffff", "none", null])
    const chromatic = [...canvasElement.querySelectorAll("path,rect,circle")]
      .map((node) => node.getAttribute("fill"))
      .filter((fill) => !achromatic.has(fill))
    await expect(chromatic).toEqual([])
    await expect(within(canvasElement).getByTestId("pf-logo-rtk")).toBeVisible()
  },
  render: () => (
    <PortfolioStoryCanvas>
      <div className="flex items-center gap-10">
        <CompanyLogo company="a3" height={24} />
        <CompanyLogo company="rtk" height={24} />
        <CompanyLogo company="smlt" height={24} />
      </div>
    </PortfolioStoryCanvas>
  ),
}

/**
 * Знак без словесной части — то, что стоит в кружке заголовка.
 *
 * Три знака рядом в одном кегле: только так видно, что у РТК знаковая часть
 * узкая и высокая, а у А3 и «Самолета» — плотный квадрат. Из-за этого доли от
 * диаметра кружка разные (`styles/portfolio.css`).
 */
export const Marks: Story = {
  play: async ({ canvasElement }) => {
    const achromatic = new Set(["currentColor", "white", "#FFFFFF", "#ffffff", "none", null])
    const chromatic = [...canvasElement.querySelectorAll("path,rect,circle")]
      .map((node) => node.getAttribute("fill"))
      .filter((fill) => !achromatic.has(fill))
    await expect(chromatic).toEqual([])

    // Словесной части в знаке для кружка нет: у РТК полный логотип 338×86, и
    // при вписывании по ширине слово стало бы 7 px высотой.
    const rtk = canvasElement.querySelector<SVGSVGElement>(
      '[data-testid="pf-logo-rtk"][data-variant="mark"] svg',
    )!
    await expect(rtk.getAttribute("viewBox")).toBe("0 0 52 86")
  },
  render: () => (
    <PortfolioStoryCanvas>
      <div className="flex items-center gap-10">
        <CompanyLogo company="a3" height={28} variant="mark" />
        <CompanyLogo company="rtk" height={28} variant="mark" />
        <CompanyLogo company="smlt" height={28} variant="mark" />
      </div>
    </PortfolioStoryCanvas>
  ),
}
