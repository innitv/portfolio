/**
 * Манифест оптимизированных кадров портфолио — СГЕНЕРИРОВАН, руками не правится.
 *
 * Источник: public/assets/optimized (78 файлов webp, скопированы
 * из C:/Project/siteportfolio/public/assets/optimized). Ключ — базовое имя файла
 * без суффикса ширины; значение — доступные ширины по возрастанию.
 *
 * Зачем манифест, а не строка src по месту: правило STYLE_GUIDE.md
 * «ни один кадр не растянут выше natural/1.5» проверяется по МАКСИМАЛЬНОЙ
 * доступной ширине, и она обязана быть известна коду, а не глазам.
 */

export interface OptimizedImage {
  /** Доступные ширины webp по возрастанию. */
  widths: number[]
}

export const optimizedImages = {
  "35KZ4z8mfO8o60nT7OmQ5Pdu8o": { widths: [480, 768, 1120, 1600, 2880] },
  "TgXHntK01EHbrcKym9ipP0rttXU": { widths: [480, 768, 1120, 1600, 2720] },
  "a3-dashboard-redesign-figma-hero-BMeVnBgb": { widths: [480, 768, 1120, 1600, 2160] },
  "a3-dashboard-redesign-figma-main-card-CSycQJK_": { widths: [480, 717] },
  "a3-dashboard-redesign-slider-left-D6iXZ8kI": { widths: [480, 567] },
  "a3-dashboard-redesign-slider-right-CLle2rrg": { widths: [480, 567] },
  "a3-design-system-component-detail-DE1xrYev": { widths: [480, 768, 821] },
  "a3-design-system-components-1-3gX_JlqE": { widths: [480, 768, 819] },
  "a3-design-system-components-2-BMrA8rxI": { widths: [480, 768, 801] },
  "a3-design-system-conclusion-component-yZRrWGs5": { widths: [480, 768, 1120, 1127] },
  "a3-design-system-token-1-CJRZZAKN": { widths: [480, 768, 853] },
  "a3-design-system-token-2-BtSGvlp5": { widths: [480, 768, 1060] },
  "a3-flow-figma-hero-CsT6xTUU": { widths: [480, 768, 1120, 1287] },
  "a3-flow-new-simplified-form-SVANcMpZ": { widths: [480, 768, 1120, 1327] },
  "a3-flow-old-login-CMMyur3R": { widths: [480, 768, 1120, 1308] },
  "a3-flow-old-registration-Ba-PShoo": { widths: [480, 768, 1043] },
  "rtk-onboarding-hero-DMLR2-UA": { widths: [480, 768, 1120, 1600, 2120] },
  "rtk-subscriptions-hero-BkvQSUev": { widths: [480, 768, 1120, 1434] },
  "rtk-web-hero-1-C1lkPSkp": { widths: [480, 768, 1120, 1192] },
  "rtk-web-hero-2-CiXfHd40": { widths: [480, 768, 1120, 1192] },
  "rtk-web-visual-solutions-1-CkWHlz8Y": { widths: [480, 768, 987] },
  "rtk-web-visual-solutions-2-DWZ_VM1q": { widths: [480, 768, 987] },
} as const satisfies Record<string, OptimizedImage>

export type OptimizedImageKey = keyof typeof optimizedImages
