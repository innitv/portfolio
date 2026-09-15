import { archiveCompanies } from "@/views/portfolio-archive.model"
import { companies } from "@/views/portfolio.data"

/**
 * ─── ЧТО САЙТ РАССКАЗЫВАЕТ О СЕБЕ ──────────────────────────────────────────
 *
 * До 15.09.2026 все четырнадцать адресов отдавали один `<title>` и ни одного
 * описания: в выдаче четырнадцать страниц выглядели одной, а ссылка на кейс
 * разворачивалась в мессенджере пустой карточкой.
 *
 * 🔴 ТЕКСТЫ НЕ СОЧИНЯЮТСЯ ЗДЕСЬ. Всё, что попадает в заголовок и описание,
 * берётся из `portfolio.data.ts` — это правило проекта, и мета ему подчиняется
 * так же, как экран. Здесь только склейка: имя кейса плюс компания, описание —
 * готовый `summary` или `description`.
 *
 * 🔴 Мета проставляется и в рантайме, и в сборке. В рантайме — этим модулем
 * при каждой смене экрана; в сборке — пререндером (`tools/prerender-portfolio.mjs`),
 * который открывает каждый адрес в настоящем браузере и записывает получившийся
 * HTML. Второй источник поэтому не заводится: пререндер снимает ровно то, что
 * поставил этот код.
 */

/** Домен сайта. Канонический адрес обязан быть абсолютным. */
export const SITE_ORIGIN = "https://ivan-ignatov.online"

/**
 * Кадр для карточки ссылки: `public/assets/og-cover.png`, 1200 × 630.
 *
 * Собран разово (кобальт, имя, домен) — генератора под него нет: карточка
 * меняется раз в год, а скрипт ради одного файла пришлось бы сопровождать.
 */
const OG_IMAGE = `${SITE_ORIGIN}/assets/og-cover.png`

const AUTHOR = "Иван Игнатов"

export interface ScreenMeta {
  canonical: string
  description: string
  title: string
}

/** Адрес экрана без домена — та же форма, что у маршрутов. */
export function pathForScreen(companyId?: string, caseId?: string): string {
  if (!companyId) return "/"
  if (!caseId) return `/${companyId}`
  return `/${companyId}/case/${caseId}`
}

/**
 * Заголовок и описание экрана.
 *
 * Порядок слов в заголовке — от частного к общему: имя кейса, компания, автор.
 * Так он читается и целиком, и обрезанным до первых сорока знаков, как его
 * показывает выдача.
 */
export function metaForScreen(companyId?: string, caseId?: string): ScreenMeta {
  const canonical = `${SITE_ORIGIN}${pathForScreen(companyId, caseId)}`
  const company = companies.find((item) => item.id === companyId)

  if (!company) {
    const home = archiveCompanies.map((item) => item.wordmark).join(", ")
    return {
      canonical,
      description: `Портфолио продуктового дизайнера: B2B-платежи, сервисные кабинеты, подписки и proptech. Компании: ${home}.`,
      title: `${AUTHOR} — продуктовый дизайнер`,
    }
  }

  const study = caseId ? company.cases.find((item) => item.id === caseId) : undefined

  if (!study) {
    return {
      canonical,
      description: company.description,
      title: `${company.name} — кейсы · ${AUTHOR}`,
    }
  }

  return {
    canonical,
    description: study.summary,
    title: `${study.title} · ${company.name} — ${AUTHOR}`,
  }
}

/** Ставит или заводит один тег `<meta>`, отличая свойство от имени. */
function setMeta(kind: "name" | "property", key: string, content: string): void {
  const selector = `meta[${kind}="${key}"]`
  let node = document.head.querySelector<HTMLMetaElement>(selector)

  if (!node) {
    node = document.createElement("meta")
    node.setAttribute(kind, key)
    document.head.append(node)
  }

  node.setAttribute("content", content)
}

/**
 * Применяет мета текущего экрана к документу.
 *
 * Зовётся из одного места — `PortfolioRoute`, — потому что там же единственная
 * точка смены экрана: и нажатия, и кнопки браузера идут через `navigate`.
 */
export function applyScreenMeta(companyId?: string, caseId?: string): void {
  const meta = metaForScreen(companyId, caseId)

  document.title = meta.title
  setMeta("name", "description", meta.description)

  /* Канонический адрес: разбор маршрута снисходителен, и без него `/a3/case/nope`
     читался бы поиском как отдельная страница с содержимым первого кейса. */
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement("link")
    link.rel = "canonical"
    document.head.append(link)
  }
  link.href = meta.canonical

  /*
    Цвет полосы браузера на телефоне — под поверхность ЭКРАНА, а не один на
    сайт: главная и синий экран чернильные, страница кейса светлая. Один цвет
    на все давал бы тёмную полосу над белой страницей и наоборот.
  */
  setMeta("name", "theme-color", caseId ? "#fdfdfc" : "#0b0b0b")

  /* Карточка ссылки: мессенджеры и соцсети JS не исполняют, поэтому теги
     обязаны оказаться в ИСХОДНИКЕ страницы — их туда кладёт пререндер. */
  setMeta("property", "og:type", "website")
  setMeta("property", "og:site_name", `${AUTHOR} — портфолио`)
  setMeta("property", "og:title", meta.title)
  setMeta("property", "og:description", meta.description)
  setMeta("property", "og:url", meta.canonical)
  setMeta("property", "og:image", OG_IMAGE)
  setMeta("name", "twitter:card", "summary_large_image")
  setMeta("name", "twitter:title", meta.title)
  setMeta("name", "twitter:description", meta.description)
  setMeta("name", "twitter:image", OG_IMAGE)
}
