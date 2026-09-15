/**
 * Манифест оптимизированных кадров портфолио — СГЕНЕРИРОВАН, руками не правится.
 *
 * Источник: public/assets/optimized. Ключ — базовое имя файла без суффикса
 * ширины; значение — доступные ширины по возрастанию и признак `avif`, если
 * этот формат собран во всех ширинах ключа.
 *
 * Собирается `python tools/build-portfolio-avif.py`.
 *
 * Зачем манифест, а не строка src по месту: правило STYLE_GUIDE.md
 * «ни один кадр не растянут выше natural/1.5» проверяется по МАКСИМАЛЬНОЙ
 * доступной ширине, и она обязана быть известна коду, а не глазам.
 */

export interface OptimizedImage {
  /** Доступные ширины по возрастанию. */
  widths: number[]
  /** AVIF собран во всех этих ширинах. */
  avif?: true
}

export const optimizedImages = {
  "35KZ4z8mfO8o60nT7OmQ5Pdu8o": { widths: [480, 768, 1120, 1600, 2880], avif: true },
  "TgXHntK01EHbrcKym9ipP0rttXU": { widths: [480, 768, 1120, 1600, 2720], avif: true },
  "a3-dashboard-redesign-before-FUsH1gNh": { widths: [480, 768, 1120, 1600, 1972], avif: true },
  "a3-dashboard-redesign-before-mobile-C8RFrL70": { widths: [480, 768, 856], avif: true },
  "a3-dashboard-redesign-components-UbGwkxu2": { widths: [480, 768, 1120, 1600, 2054], avif: true },
  "a3-dashboard-redesign-figma-hero-BMeVnBgb": { widths: [480, 768, 1120, 1600, 2160], avif: true },
  "a3-dashboard-redesign-figma-main-card-CSycQJK_": { widths: [480, 717], avif: true },
  "a3-dashboard-redesign-hero-tablet-KPENHxhA": { widths: [480, 768, 1120, 1600, 1972], avif: true },
  "a3-dashboard-redesign-mobile-Av9emCe4": { widths: [480, 768, 856], avif: true },
  "a3-dashboard-redesign-slider-left-D6iXZ8kI": { widths: [480, 567], avif: true },
  "a3-dashboard-redesign-slider-right-CLle2rrg": { widths: [480, 567], avif: true },
  "a3-design-system-component-detail-DE1xrYev": { widths: [480, 768, 821], avif: true },
  "a3-design-system-components-1-3gX_JlqE": { widths: [480, 768, 819], avif: true },
  "a3-design-system-components-2-BMrA8rxI": { widths: [480, 768, 801], avif: true },
  "a3-design-system-conclusion-component-yZRrWGs5": { widths: [480, 768, 1120, 1127], avif: true },
  "a3-design-system-token-1-CJRZZAKN": { widths: [480, 768, 853], avif: true },
  "a3-design-system-token-2-BtSGvlp5": { widths: [480, 768, 1060], avif: true },
  "a3-ds-colors-aUCl893J": { widths: [480, 768, 1120, 1500], avif: true },
  "a3-ds-hero": { widths: [480, 768, 1120, 1600, 2240], avif: true },
  "a3-ds-properties-Ea1XteFG": { widths: [480, 768, 1120, 1500], avif: true },
  "a3-ds-size-tokens-qVHV3wws": { widths: [480, 768, 1120, 1600, 2160, 2958], avif: true },
  "a3-ds-states-dDWJV6_n": { widths: [480, 768, 1120, 1600, 2160, 2958], avif: true },
  "a3-ds-variant-tokens-yXeIn6cg": { widths: [480, 768, 1120, 1600, 2160, 2958], avif: true },
  "a3-flow-figma-hero-CsT6xTUU": { widths: [480, 768, 1120, 1287], avif: true },
  "a3-flow-hero-tablet-qZfBK0et": { widths: [480, 768, 1120, 1600, 1972], avif: true },
  "a3-flow-mobile-EdcQUsCQ": { widths: [480, 768, 856], avif: true },
  "a3-flow-new-simplified-form-SVANcMpZ": { widths: [480, 768, 1120, 1327], avif: true },
  "a3-flow-old-form-KUhZimGB": { widths: [480, 768, 1120, 1600, 2160, 2958], avif: true },
  "a3-flow-old-login-CMMyur3R": { widths: [480, 768, 1120, 1308], avif: true },
  "a3-flow-old-mobile-w3cY9Hsn": { widths: [480, 768, 1120, 1284], avif: true },
  "a3-flow-old-registration-Ba-PShoo": { widths: [480, 768, 1043], avif: true },
  "a3-flow-registration-steps-SNaTIFUA": { widths: [480, 768, 1120, 1600, 2160, 2784], avif: true },
  "rtk-onboarding-hero-DMLR2-UA": { widths: [480, 768, 1120, 1600, 2120], avif: true },
  "rtk-sub-after-home": { widths: [480, 768, 1120], avif: true },
  "rtk-sub-after-services": { widths: [480, 768, 1120, 1600, 2140], avif: true },
  "rtk-sub-before-balance": { widths: [480, 768, 1120, 1600, 2140], avif: true },
  "rtk-sub-before-history": { widths: [480, 768, 1120, 1600, 2140], avif: true },
  "rtk-sub-before-menu": { widths: [480, 768, 1120, 1600, 2140], avif: true },
  "rtk-sub-before-tariff": { widths: [480, 768, 1120], avif: true },
  "rtk-subscriptions-hero-BkvQSUev": { widths: [480, 768, 1120, 1434], avif: true },
  "rtk-web-hero-1-C1lkPSkp": { widths: [480, 768, 1120, 1192], avif: true },
  "rtk-web-hero-2-CiXfHd40": { widths: [480, 768, 1120, 1192], avif: true },
  "rtk-web-new-connected": { widths: [480, 768, 1120, 1600, 1720], avif: true },
  "rtk-web-new-hero": { widths: [480, 768, 1120, 1600, 2240, 2960], avif: true },
  "rtk-web-new-options": { widths: [480, 768, 1120, 1600, 1720], avif: true },
  "rtk-web-visual-solutions-1-CkWHlz8Y": { widths: [480, 768, 987], avif: true },
  "rtk-web-visual-solutions-2-DWZ_VM1q": { widths: [480, 768, 987], avif: true },
  "smlt-mdg-card": { widths: [480, 768, 1120, 1600, 1900, 1930], avif: true },
  "smlt-mdg-edit": { widths: [480, 768, 1120, 1600, 1900, 1930], avif: true },
  "smlt-mdg-fact": { widths: [480, 768, 1120, 1600, 1900], avif: true },
  "smlt-mdg-import": { widths: [480, 768, 1120, 1600, 1900, 1940], avif: true },
  "smlt-mdg-review": { widths: [480, 768, 1120, 1600, 1900], avif: true },
  "smlt-om-card": { widths: [480, 768, 1120, 1440], avif: true },
  "smlt-om-empty": { widths: [480, 768, 1120, 1440], avif: true },
  "smlt-om-files": { widths: [480, 768, 1120, 1440], avif: true },
  "smlt-om-filters": { widths: [480, 768, 1120, 1440], avif: true },
  "smlt-om-map": { widths: [480, 768, 1120, 1440], avif: true },
} as const satisfies Record<string, OptimizedImage>

export type OptimizedImageKey = keyof typeof optimizedImages
