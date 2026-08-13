import {
  caseCountLabel,
  caseMetrics,
  companies,
  type CompanyId,
  type Company,
} from "./portfolio.data"

/**
 * Содержимое экрана `/archive`, выведенное из данных сайта.
 *
 * ─── ЗАЧЕМ ОТДЕЛЬНЫЙ МОДУЛЬ ─────────────────────────────────────────────────
 * В прототипе (`outputs/portfolio-swiss-shot/2026-08-11/prototype/v8.html`)
 * данные были вписаны в разметку руками и местами расходились с сайтом: у А3
 * стояли числа, которые на самом деле принадлежат кейсу РТК. Здесь ни одной
 * строки контента не объявлено — всё поднимается из `portfolio.data.ts`,
 * единственного источника текстов сайта. Этот файл только ПЕРЕКЛАДЫВАЕТ их в
 * форму, которую ждёт экран.
 *
 * Правило `portfolio.data.ts` действует и тут: ни одна фраза не сочиняется и не
 * редактируется. Всё, что делают функции ниже, — выбор и разрезание уже
 * существующих строк.
 */

/**
 * Латинское начертание имени компании.
 *
 * Единственное место, где на сайте появляется не-кириллическое имя, и это
 * решение владельца по макету: экран набран латиницей (PRODUCT / Archive /
 * SAMOLET / RTK), потому что он строится на швейцарской типографике и на
 * гоночном знаке. Кириллические имена («А3», «РТК», «Самолет») остаются в
 * данных и работают на остальных трёх страницах сайта без изменений.
 *
 * Это НЕ перевод и не новый контент: то же самое слово в другом алфавите,
 * зафиксированное макетом.
 */
export const WORDMARK: Record<CompanyId, string> = {
  a3: "A3",
  rtk: "RTK",
  smlt: "SAMOLET",
}

/**
 * Порядок имён в ряду.
 *
 * Взят из макета, а не из порядка данных: длинное SAMOLET стоит посередине,
 * между двумя короткими, и ряд читается симметрично. В `portfolio.data.ts`
 * порядок другой (a3, rtk, smlt) — он определяет остальные страницы и здесь не
 * меняется.
 */
const ORDER: CompanyId[] = ["a3", "smlt", "rtk"]

export interface ArchiveCase {
  caseId: string
  /** Римская нумерация из данных: I, II, III. */
  index: string
  /** Итог кейса одной строкой — поле `impact`. */
  impact: string
  title: string
}

export interface ArchiveFact {
  /** Остаток фразы: подпись под величиной. */
  caption: string
  /** Величина: числовой фрагмент фразы либо её первое слово. */
  value: string
}

export interface ArchiveCompany {
  cases: ArchiveCase[]
  facts: ArchiveFact[]
  id: CompanyId
  /** «B2B-платежи · 2025—н.в.» — отрасль и годы из данных. */
  meta: string
  wordmark: string
}

/** Подпись длиннее этого набирается плохо: под величиной нужна метка, не фраза. */
const CAPTION_LIMIT = 28

/**
 * Величины компании для нижней строки синего экрана.
 *
 * ─── ПОЧЕМУ НЕ `impact` ─────────────────────────────────────────────────────
 * Итог кейса уже стоит в его строке справа. Если из тех же слов собрать и
 * нижний ряд, экран покажет одно и то же дважды — в макете там как раз ДРУГОЕ:
 * числа. Поэтому источник ряда — числа из тела кейсов, `caseMetrics` из
 * `portfolio.data.ts`, то есть та же функция, что кормит сетку метрик на
 * странице кейса. Ни одна цифра не сочиняется: `value` — подстрока
 * предложения автора.
 *
 * Подпись: метка до двоеточия, если автор её оставил («Activation»,
 * «Time to Action»). Если метка — целое предложение, под числом стоит название
 * кейса: оно короткое, тоже авторское и точно называет, откуда взята величина.
 *
 * Кейс без чисел в ряд не попадает — правило `supabase.com` «нет значения, нет
 * строки», уже принятое на странице кейса. Поэтому у одних компаний величин
 * три, у других две; пустых мест ряд не держит.
 */
function archiveFacts(company: Company): ArchiveFact[] {
  const facts: ArchiveFact[] = []

  for (const study of company.cases) {
    const [metric] = caseMetrics(study, 1)
    if (!metric) continue

    facts.push({
      caption: metric.label.length <= CAPTION_LIMIT ? metric.label : study.title,
      value: metric.value,
    })
    if (facts.length === 3) break
  }

  if (facts.length < 3) {
    // «3 кейса» / «2 кейса» — строка уже существует в данных, здесь она только
    // делится на число и слово.
    const [value, ...rest] = caseCountLabel(company.cases.length).split(" ")
    facts.push({ caption: rest.join(" "), value })
  }

  return facts
}

export const archiveCompanies: ArchiveCompany[] = ORDER.map((id) => {
  const company = companies.find((item) => item.id === id)
  if (!company) throw new Error(`Компания ${id} отсутствует в portfolio.data.ts`)

  return {
    cases: company.cases.map((study) => ({
      caseId: study.id,
      index: study.index,
      impact: study.impact,
      title: study.title,
    })),
    facts: archiveFacts(company),
    id: company.id,
    meta: [company.industry, company.years].filter(Boolean).join(" · "),
    wordmark: WORDMARK[company.id],
  }
})
