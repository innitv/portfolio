import * as React from "react"

import "@/styles/portfolio-brief.css"

import {
  BRIEF_CONTACT,
  BRIEF_FIELDS,
  BRIEF_KINDS,
  BRIEF_MODES,
  BRIEF_SECTIONS,
  type BriefField,
  type BriefMode,
} from "./brief.data"

/**
 * ─── БРИФ: СКРЫТАЯ СТРАНИЦА ────────────────────────────────────────────────
 *
 * Адрес `/brief` не стоит ни в меню, ни в карте сайта, ни в `robots.txt`, и на
 * него не ведёт ни одна ссылка — он отправляется человеку вручную. От поиска
 * страницу закрывает заголовок `X-Robots-Tag` из `public/.htaccess`: мета из
 * рантайма тут не спасает, потому что прямой заход на SPA отдаёт
 * пререндеренный шаблон, и краулер без JS никакого `noindex` не увидит.
 *
 * Ответ уходит на `/brief-send.php` — свой обработчик на том же хостинге.
 * Данные не проходят через сторонние сервисы форм.
 *
 * ─── ЧТО ЗДЕСЬ СДЕЛАНО ПО РАЗБОРУ, А НЕ ПО ПРИВЫЧКЕ ────────────────────────
 * 1. Метки настоящие, плейсхолдеров вместо них нет: у Caroline Jarrett 98–99 %
 *    людей приняли текст ВНУТРИ поля за уже вписанный ответ.
 * 2. Проверка только по отправке, со сводкой ошибок и фокусом на неё.
 * 3. Текстовые поля растут под ответ, и об этом сказано словами: нейтральная
 *    приписка про размер поля даёт более длинные ответы БЕЗ роста пропусков
 *    (Smyth и др., POQ 2009), а приписка «это очень важно, не торопитесь» —
 *    даёт и то и другое, поэтому её здесь нет.
 * 4. Полосы прогресса нет: мета-анализ 32 экспериментов не нашёл выигрыша, а
 *    медленная в начале полоса повышает шанс ухода.
 */

/** Год в служебной строке шапки — тот же приём, что «портфолио · 2026» на сайте. */
const YEAR = new Date().getFullYear()

/** Куда уходит заполненный бриф. */
const ENDPOINT = "/brief-send.php"

/**
 * Ключ групповой ошибки «нет ни одного контакта».
 *
 * Он соседствует в списке недостающего с настоящими полями, поэтому начинается
 * с двух подчёркиваний: так его нельзя спутать с `id` вопроса, а вопроса с
 * таким именем в брифе не появится.
 */
const CONTACT_KEY = "__contact"

/** Одно сообщение на пару полей, поэтому и id у него один. */
const CONTACT_ERROR_ID = "brief-contact-error"

/** Черновик переживает закрытие вкладки: форма длинная, её бросают и возвращаются. */
const DRAFT_KEY = "portfolio-brief-draft"

type Answers = Record<string, string | string[]>

/**
 * Ошибка поля. `text` может отсутствовать: тогда поле только подсвечено и
 * ссылается на сообщение соседа — так устроена групповая ошибка связи.
 */
interface FieldError {
  id: string
  text?: string
}

/**
 * Чтение черновика.
 *
 * 🔴 В try/catch, и это не перестраховка: обращение к `localStorage` БРОСАЕТ
 * исключение, когда человек запретил сайтам хранить данные, — а это частая
 * настройка в корпоративном браузере, где как раз и сидит заказчик. Без защиты
 * форма не отрисовалась бы вовсе.
 */
function readDraft(): Answers {
  try {
    const saved = window.localStorage.getItem(DRAFT_KEY)
    return saved ? (JSON.parse(saved) as Answers) : {}
  } catch {
    return {}
  }
}

function writeDraft(answers: Answers): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(answers))
  } catch {
    /* Хранить негде — не беда: форма работает и без черновика. */
  }
}

function dropDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* см. выше */
  }
}

/*
 * 🔴 ВЫХОДА НА САЙТ С БРИФА НЕТ, и это решение владельца 03.11.2026.
 *
 * Кнопка «← на главную» стояла в шапке и на экране благодарности, пока бриф
 * считался страницей сайта. Он ею не является: ссылку человек получает в
 * переписке, портфолио он к этому моменту уже посмотрел, а на странице у него
 * ровно одно дело. Выход из формы посреди заполнения — единственное, что эта
 * кнопка предлагала, и предлагала она это рядом с первым же полем.
 *
 * Поэтому у вида нет пропа перехода вовсе: отсутствие кнопки — свойство
 * экрана, а не настройка, которую можно случайно передать.
 */
export function PortfolioBriefView() {
  const [mode, setMode] = React.useState<BriefMode>("points")
  const [kind, setKind] = React.useState<"site" | "product" | null>(null)
  const [answers, setAnswers] = React.useState<Answers>(() => readDraft())
  const [missing, setMissing] = React.useState<string[]>([])
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "failed">("idle")

  /* Время заполнения: обработчик отбрасывает мгновенные отправки ботов. */
  const startedAt = React.useRef(Date.now())
  const summaryRef = React.useRef<HTMLDivElement>(null)

  /*
    Поверхность страницы: тот же приём, что у остальных экранов — атрибут на
    документе, по которому слой стилей красит канву.
  */
  React.useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.portfolioSurface
    root.dataset.portfolioSurface = "brief"

    return () => {
      if (previous === undefined) delete root.dataset.portfolioSurface
      else root.dataset.portfolioSurface = previous
    }
  }, [])

  /*
   * Фокус уходит на сводку ошибок — так человек СЛЫШИТ, сколько всего не
   * хватает, вместо того чтобы искать красные рамки по странице.
   *
   * 🔴 Это ЭФФЕКТ, а не строка в обработчике отправки. В обработчике
   * `summaryRef.current` ещё пуст: сводка появляется в том же обновлении,
   * которое её и заводит, то есть после обработчика. Первая версия звала
   * `focus()` прямо там — и фокус молча оставался на кнопке; замер в браузере
   * показал `activeElement` вне сводки при трёх найденных ошибках.
   */
  React.useEffect(() => {
    if (missing.length) summaryRef.current?.focus()
  }, [missing])

  const setAnswer = React.useCallback((id: string, value: string | string[]) => {
    setAnswers((previous) => {
      const next = { ...previous, [id]: value }
      writeDraft(next)
      return next
    })
  }, [])

  /**
   * Видно ли поле сейчас: режим подачи и род задачи решают это вместе.
   *
   * Невидимое поле не проверяется и не уходит в письмо — иначе человек получал
   * бы ошибку на вопрос, которого не видит.
   */
  const visibleSections = React.useMemo(
    () => BRIEF_SECTIONS.filter((section) => !section.mode || section.mode === mode),
    [mode],
  )

  const visibleFields = React.useMemo(() => {
    const fields: BriefField[] = []
    for (const section of visibleSections) {
      for (const field of section.fields) {
        if (!field.only || field.only === kind) fields.push(field)
      }
    }
    return fields
  }, [kind, visibleSections])

  /**
   * Ошибка конкретного поля: своя или доставшаяся от группы.
   *
   * 🔴 У групповой ошибки ОДИН текст на пару полей, но подсвечены оба. Если бы
   * текст стоял под каждым, человек читал бы «оставьте хотя бы один способ
   * связи» дважды подряд и решал, не два ли это разных требования. Поэтому
   * второе поле пары только ссылается на чужое сообщение через `aria-describedby`.
   */
  const errorFor = React.useCallback(
    (field: BriefField): FieldError | undefined => {
      if (missing.includes(field.id)) {
        return { id: `brief-${field.id}-error`, text: "Без этого ответа не обойтись" }
      }

      if (missing.includes(CONTACT_KEY) && BRIEF_CONTACT.ids.includes(field.id)) {
        const last = BRIEF_CONTACT.ids[BRIEF_CONTACT.ids.length - 1]
        return { id: CONTACT_ERROR_ID, text: field.id === last ? BRIEF_CONTACT.message : undefined }
      }

      return undefined
    },
    [missing],
  )

  const submit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()

      /*
        🔴 Проверка ТОЛЬКО по отправке, а не при уходе из поля. У брифа длинные
        текстовые ответы, и проверка на лету ругается на недописанную мысль —
        GOV.UK отдельно предупреждает об этом классе раздражения.
      */
      const filled = (id: string) => String(answers[id] ?? "").trim() !== ""

      const empty = visibleFields
        .filter((field) => field.required && !filled(field.id))
        .map((field) => field.id)

      /*
       * Связь обязательна, а конкретное поле — нет. Проверяется только если
       * сами поля на экране есть: раздел контактов виден всегда, но завязывать
       * проверку на это молчаливое знание нельзя.
       */
      const contactsShown = visibleFields.some((field) => BRIEF_CONTACT.ids.includes(field.id))
      if (contactsShown && !BRIEF_CONTACT.ids.some(filled)) empty.push(CONTACT_KEY)

      setMissing(empty)
      if (empty.length) return

      setState("sending")

      /* В письмо уходят только заданные вопросы — ответы на скрытые не нужны. */
      const payload: Answers = {}
      for (const field of visibleFields) {
        const value = answers[field.id]
        if (value !== undefined && String(value).trim() !== "") payload[field.id] = value
      }

      try {
        const response = await fetch(ENDPOINT, {
          body: JSON.stringify({
            answers: {
              "Род задачи":
                mode === "free"
                  ? "Своими словами"
                  : kind === "product"
                    ? "Продукт или кабинет"
                    : kind === "site"
                      ? "Сайт"
                      : "Не выбран",
              ...payload,
            },
            elapsed: Math.round((Date.now() - startedAt.current) / 1000),
            website: "",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })

        /*
         * 🔴 Успехом считается только `{ "ok": true }` ОТ ПРИЁМНИКА, а не код
         * 200. Разница не теоретическая: если `brief-send.php` не выгружен или
         * PHP на хостинге молчит, запрос попадает в SPA-fallback из `.htaccess`
         * и сервер отдаёт index.html со статусом 200. Первая версия проверяла
         * только `response.ok` — и на локальном прогоне форма показала «Бриф у
         * меня», получив в ответ HTML главной. Человек уходит довольный, а на
         * другом конце пусто: ровно то, ради чего у приёмника два канала.
         */
        const result = await response.json().catch(() => null)
        if (!response.ok || !result || result.ok !== true) {
          throw new Error(String(response.status))
        }

        dropDraft()
        setState("done")
      } catch {
        setState("failed")
      }
    },
    [answers, kind, mode, visibleFields],
  )

  if (state === "done") {
    return (
      <div className="pb-root" data-testid="pb-root">
        <div className="pb-screen">
          <div className="pb-done">
            <h1 className="pb-title">Бриф у меня</h1>
            <p className="pb-lede">
              Прочитаю и отвечу в течение двух рабочих дней — на почту, которую вы оставили. Если
              задача срочная, напишите в телеграм: <a href="https://t.me/innitv">@innitv</a>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-root" data-testid="pb-root">
      <div className="pb-screen">
        <div className="pb-top">
          <span>бриф</span>
          <span>{YEAR}</span>
        </div>

        <header className="pb-head">
          <h1 className="pb-title">Бриф</h1>
          <p className="pb-lede">
            Чем подробнее опишете задачу, тем предметнее будет первый разговор. Обязательных
            вопросов два: имя и одна строка о задаче. Остальное можно пропустить, «не знаю» тоже
            ответ. Поля растут под ответ — пишите столько, сколько нужно.
          </p>
        </header>

        <form className="pb-form" noValidate onSubmit={submit}>
          {missing.length > 0 ? (
            <div className="pb-errors" ref={summaryRef} role="alert" tabIndex={-1}>
              <strong>
                {missing.length === 1 ? "Не хватает одного ответа" : "Не хватает ответов"}
              </strong>
              <ul>
                {missing.map((id) => (
                  <li key={id}>
                    <a href={`#brief-${id === CONTACT_KEY ? BRIEF_CONTACT.ids[0] : id}`}>
                      {id === CONTACT_KEY
                        ? BRIEF_CONTACT.message
                        : BRIEF_FIELDS.find((field) => field.id === id)?.question}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/*
            Два режима подачи. Переключатель стоит ПЕРВЫМ: он решает, что человек
            увидит ниже, и спрашивать его после десяти вопросов было бы поздно.
          */}
          <fieldset className="pb-choose">
            <legend className="pb-section-title">Как вам удобнее отвечать</legend>
            <div className="pb-choose-row">
              {BRIEF_MODES.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className="pb-option-card"
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  type="button"
                >
                  <span className="pb-option-title">{item.title}</span>
                  <span className="pb-option-note">{item.note}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {mode === "points" ? (
            <fieldset className="pb-choose">
              <legend className="pb-section-title">Сайт или продукт</legend>
              <p className="pb-hint">От ответа зависит половина вопросов ниже.</p>
              <div className="pb-choose-row">
                {BRIEF_KINDS.map((item) => (
                  <button
                    aria-pressed={kind === item.id}
                    className="pb-option-card"
                    key={item.id}
                    onClick={() => setKind(item.id)}
                    type="button"
                  >
                    <span className="pb-option-title">{item.title}</span>
                    <span className="pb-option-note">{item.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {visibleSections.map((section) => {
            const fields = section.fields.filter((field) => !field.only || field.only === kind)
            if (!fields.length) return null

            return (
              <section className="pb-section" key={section.id}>
                <h2 className="pb-section-title">{section.title}</h2>
                {section.lede ? <p className="pb-hint">{section.lede}</p> : null}

                {fields.map((field) => (
                  <BriefControl
                    error={errorFor(field)}
                    field={field}
                    key={field.id}
                    onChange={setAnswer}
                    value={answers[field.id] ?? (field.kind === "multi" ? [] : "")}
                  />
                ))}
              </section>
            )
          })}

          {/*
            Приманка для ботов: человек этого поля не видит и не доходит до него
            табуляцией, бот заполняет все поля подряд. Обработчик отвечает такому
            отправителю успехом, чтобы он не подбирал обход.
          */}
          <input
            aria-hidden="true"
            autoComplete="off"
            className="pb-trap"
            name="website"
            tabIndex={-1}
            type="text"
          />

          <div className="pb-send">
            <button className="pb-submit" disabled={state === "sending"} type="submit">
              {state === "sending" ? "Отправляю…" : "Отправить бриф"}
            </button>
            <p className="pb-hint">
              Ответы уходят прямо мне на почту и никуда больше. Черновик сохраняется в этом
              браузере — можно закрыть вкладку и вернуться.
            </p>
            {state === "failed" ? (
              <p className="pb-failed" role="alert">
                Не отправилось. Текст остался в форме — попробуйте ещё раз или пришлите его
                письмом на <a href="mailto:i@ivan-ignatov.ru">i@ivan-ignatov.ru</a>.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

/** Одно поле: метка, пояснение, сам ввод. */
function BriefControl({
  error,
  field,
  onChange,
  value,
}: {
  error?: FieldError
  field: BriefField
  onChange: (id: string, value: string | string[]) => void
  value: string | string[]
}) {
  const id = `brief-${field.id}`
  const hintId = field.hint ? `${id}-hint` : undefined
  const invalid = Boolean(error)
  const describedBy = [hintId, error?.id].filter(Boolean).join(" ") || undefined

  /*
    Сообщение рисуется только там, где у ошибки есть текст. У групповой ошибки
    он один на пару полей, и второе поле ссылается на чужой `id` — сообщение
    всё равно прочитается диктором, потому что стоит в `aria-describedby`.
  */
  const errorNode = error?.text ? (
    <p className="pb-field-error" id={error.id}>
      {error.text}
    </p>
  ) : null

  const mark = field.required ? <span className="pb-required"> — обязательно</span> : null

  /*
    🔴 Помечаются ОБЯЗАТЕЛЬНЫЕ поля, и словом, а не звёздочкой. Пометка несёт
    смысл только когда помечено меньшинство: здесь обязательных два из двух
    десятков. Звёздочка при этом хуже слова — её не читает ни человек, впервые
    видящий форму, ни экранный диктор без подсказки.
  */
  const hint = field.hint ? (
    <p className="pb-hint" id={hintId}>
      {field.hint}
    </p>
  ) : null

  if (field.kind === "choice" || field.kind === "multi") {
    const picked = Array.isArray(value) ? value : [value].filter(Boolean)

    return (
      <fieldset className="pb-field" data-invalid={invalid || undefined} id={id}>
        <legend className="pb-label">
          {field.question}
          {mark}
        </legend>
        {hint}
        <div className="pb-options">
          {(field.options ?? []).map((option) => (
            <label className="pb-option" key={option}>
              <input
                checked={picked.includes(option)}
                name={id}
                onChange={() => {
                  if (field.kind === "choice") return onChange(field.id, option)
                  const next = picked.includes(option)
                    ? picked.filter((item) => item !== option)
                    : [...picked, option]
                  onChange(field.id, next)
                }}
                type={field.kind === "choice" ? "radio" : "checkbox"}
                value={option}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {errorNode}
      </fieldset>
    )
  }

  return (
    <div className="pb-field" data-invalid={invalid || undefined}>
      <label className="pb-label" htmlFor={id}>
        {field.question}
        {mark}
      </label>
      {hint}
      {field.kind === "long" ? (
        <GrowingArea
          describedBy={describedBy}
          id={id}
          invalid={invalid}
          onChange={(next) => onChange(field.id, next)}
          value={String(value)}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete={AUTOCOMPLETE[field.id] ?? "off"}
          className="pb-input"
          id={id}
          onChange={(event) => onChange(field.id, event.target.value)}
          type={field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text"}
          value={String(value)}
        />
      )}
      {errorNode}
    </div>
  )
}

/**
 * Текстовое поле, которое растёт под ответ.
 *
 * 🔴 Рост не украшение, а условие правдивости подписи. Размер поля задаёт длину
 * ответа: в полевом эксперименте (Israel, 2010, 2257 анкет, семь высот поля)
 * среднее число слов росло с 10.9 до 25.0 при неизменной доле ответивших, а
 * самое мелкое поле прямо вредило — 16.9 % писали МИМО него. В шапке формы
 * сказано «поля растут под текст»; если бы поле не росло, это была бы ложь, и
 * человек, упёршийся в четыре строки, оборвал бы ответ на середине.
 */
function GrowingArea({
  describedBy,
  id,
  invalid,
  onChange,
  value,
}: {
  describedBy?: string
  id: string
  invalid: boolean
  onChange: (value: string) => void
  value: string
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  /*
    Высота пересчитывается по ЗНАЧЕНИЮ, а не по нажатию клавиши: так поле
    открывается нужной высоты и с восстановленным черновиком, а не только после
    первого ввода. Сброс в `auto` обязателен — без него `scrollHeight` помнит
    прежнюю высоту и поле только растёт.
  */
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = "auto"
    node.style.height = `${node.scrollHeight}px`
  }, [value])

  return (
    <textarea
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="pb-input pb-area"
      id={id}
      onChange={(event) => onChange(event.target.value)}
      ref={ref}
      rows={3}
      value={value}
    />
  )
}

/*
 * Подсказки автозаполнения — требование WCAG 1.3.5 для полей О САМОМ человеке.
 * На «какой у вас масштаб работы» оно не распространяется, поэтому таблица
 * короткая.
 *
 * 🔴 Адрес сайта по смыслу `url`, но `type="url"` не ставится: он требует схему,
 * и «example.com» без `https://` браузер отвергнет на отправке. Человек, который
 * пишет домен без схемы, прав; ругаться на него за это незачем.
 */
const AUTOCOMPLETE: Record<string, string> = {
  Имя: "name",
  Компания: "organization",
  Почта: "email",
  "Телеграм или телефон": "tel",
  "Что уже есть": "url",
}
