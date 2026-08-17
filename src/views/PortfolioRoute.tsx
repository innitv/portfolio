import * as React from "react"

import { ArchiveSheet } from "@/components/portfolio/archive/archive-sheet"
import { SheetCurtain } from "@/components/portfolio/archive/sheet-curtain"

/**
 * Главная и страница компании — ОДИН вид в двух состояниях: на главной ряд
 * имён открыт, у компании поверх него спущен её кобальтовый экран. Поэтому у
 * маршрутов `/` и `/<companyId>` общий компонент, а не два разных.
 *
 * 🔴 Импорт ОБЫЧНЫЙ, не ленивый — с 2026-08-15. Ленивым он был, пока этот экран
 * стоял в стороне от сайта: тогда имело смысл не тащить его 19 КБ кода и 21 КБ
 * стиля на остальные страницы. После замены дизайна он стал главной, то есть
 * самым частым входом, и ленивость начала работать против:
 *
 *   • главная ждала второй запрос вместо того, чтобы рисоваться сразу;
 *   • возврат с кейса, открытого по прямой ссылке, давал провал в 300 мс —
 *     занавес уходил на 790 мс, а экран под ним появлялся только к 1090
 *     (замер на собранной версии; в пути через главную провала не было, потому
 *     что чанк уже загружался). `React.lazy` заказывает модуль при первом
 *     РЕНДЕРЕ компонента, поэтому прогрев импортом ничего не давал.
 *
 * Цена обратного шага — 40 КБ на странице кейса при общем бандле в 396.
 * Файлы гарнитур это не тянет: `@font-face` без употребления символов их не
 * скачивает, а Playfair живёт только на главной.
 */
import { PortfolioArchiveView } from "./PortfolioArchiveView"
import { PortfolioCaseView } from "./PortfolioCaseView"

import { archiveCompanies, WORDMARK } from "./portfolio-archive.model"
import { caseById, companyById, type CompanyId } from "./portfolio.data"

/**
 * Роут портфолио: вся логика экранов собрана здесь.
 *
 * Виды остаются презентационными, поэтому их состояния снимаются историями
 * один в один.
 *
 * ─── АДРЕСА ─────────────────────────────────────────────────────────────────
 * Схема путей унаследована от прежней сборки сайта и НЕ меняется: по этим
 * адресам сайт проиндексирован и на них ведут внешние ссылки.
 *
 *   /                          главная — список всех работ
 *   /<companyId>               работы компании
 *   /<companyId>/case/<caseId> кейс
 *
 * Сегмент `case` в середине обязателен: без него `/a3/flow` было бы
 * неотличимо от компании со вложенным разделом.
 *
 * 🔴 Адреса `/archive` и `/archive/<companyId>` СНЯТЫ 2026-08-15. Они прожили
 * два дня и появились только потому, что новый дизайн строился рядом со
 * старым: главная и страница компании существовали в двух экземплярах, в двух
 * манерах, и новым нужны были свои адреса. Владелец: «новый сайт никак не
 * связан с именем архив, это просто название на главной; это тот же сайт, что
 * и раньше, просто в новом дизайне». Слово Archive осталось надписью на
 * главной и в адресах больше не участвует.
 *
 * Здесь домен свой, поэтому адреса настоящие: `history.pushState` плюс
 * `popstate`. Разбор снисходителен к хвосту — неизвестный идентификатор
 * возвращает на главную, а не показывает пустой экран.
 *
 * Отдача путей на проде обеспечивается `public/.htaccess` (SPA-fallback):
 * без него прямой заход на `/a3/case/flow` вернул бы 404 от сервера.
 */

type Screen =
  /** Главная: ряд имён, ни одна компания не раскрыта. */
  | { kind: "home" }
  /** Работы компании: тот же экран, кобальт компании спущен поверх ряда. */
  | { kind: "company"; companyId: CompanyId }
  | { kind: "case"; caseId: string; companyId: CompanyId }

/** База сайта. В проде «/», но значение приходит из сборки, а не зашито. */
const BASE = String(import.meta.env.VITE_PORTFOLIO_BASE_PATH ?? "/").replace(/\/$/, "")

/** Сегменты пути без базы. */
function pathParts(): string[] {
  const parts = window.location.pathname.split("/").filter(Boolean)
  const base = BASE.split("/").filter(Boolean)
  return base.every((part, index) => parts[index] === part) ? parts.slice(base.length) : parts
}

function href(path = ""): string {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : ""
  return `${BASE}${suffix}` || "/"
}

function readScreen(): Screen {
  let [companyId, section, caseId]: (string | undefined)[] = pathParts()

  /*
   * Совместимость с адресами, которые прожили 14-15 августа: пока новый дизайн
   * строился рядом со старым, его экраны жили на `/archive` и `/archive/<id>`.
   * Сохранённая за эти два дня ссылка обязана привести на тот же экран, а не на
   * главную «по общему правилу для неизвестного сегмента» — молча увести
   * человека не туда хуже, чем показать пустоту.
   */
  if (companyId === "archive") [companyId, section, caseId] = [section, caseId, undefined]

  if (!companyId) return { kind: "home" }

  const company = companyById(companyId)
  if (!company) return { kind: "home" }

  if (section === "case") {
    const study = caseById(company, caseId ?? company.cases[0].id) ?? company.cases[0]
    if (study) return { kind: "case", caseId: study.id, companyId: company.id }
  }

  return { kind: "company", companyId: company.id }
}

/** Единственный правильный адрес экрана. */
function pathOf(screen: Screen): string {
  if (screen.kind === "home") return ""
  if (screen.kind === "company") return screen.companyId
  return `${screen.companyId}/case/${screen.caseId}`
}

/**
 * Разбор адреса с приведением строки к тому экрану, который реально открыт.
 *
 * 🔴 Разбор снисходителен — неизвестный кейс показывает первый, неизвестная
 * компания главную, — и без этой поправки в строке оставался бы адрес, которого
 * на сайте нет: `/a3/case/nope` показывал «Редизайн главной», `/archive` —
 * главную. Для поиска это дубли одной страницы под разными адресами, а для
 * человека — ссылка, которая после копирования приведёт не туда.
 *
 * `replaceState`, а не `pushState`: поправка не должна занимать шаг в истории,
 * иначе кнопка «назад» возвращала бы на тот же экран.
 */
function readAndCanonicalize(): Screen {
  const screen = readScreen()
  const canonical = href(pathOf(screen))
  if (window.location.pathname !== canonical) {
    window.history.replaceState({}, "", canonical)
  }
  return screen
}

/**
 * Движение перехода — свойство ПАРЫ экранов, а не того, кто его вызвал.
 *
 * 🔴 До 2026-08-15 занавес взводился прямо в обработчиках нажатий, а кнопки
 * браузера меняли экран молча. Получалось, что одна и та же дорога выглядит
 * по-разному: нажал «← кейсы А3» — приходит синяя плоскость, нажал «назад» —
 * экран подменяется мгновенно. Владелец: «хочу полноценно рабочую навигацию и
 * через интерфейс, и по кнопкам назад-вперёд, чтобы всё логично работало».
 *
 * Теперь источник перехода не важен: и `go(...)`, и `popstate` идут через один
 * `navigate`, а движение выбирается здесь.
 */
type Move =
  /** Плоскость компании уезжает вверх, под ней уже открытый кейс. */
  | { kind: "curtain-out"; word: string }
  /**
   * Экран компании ПРИЕЗЖАЕТ поверх кейса — целиком, со своим спуском и
   * лесенкой, а не пустой цветной плоскостью. Так возврат идёт тем же одним
   * движением, что и открытие с главной.
   */
  | { kind: "sheet-in"; companyId: CompanyId }
  /** Синий экран спускается на ряд имён. */
  | { kind: "sheet-drop" }
  /**
   * Кейс → кейс: плоскость ПРИХОДИТ поверх старого кейса, под ней встаёт новый,
   * и она уезжает. То есть тот же занавес, что на дороге компания → кейс, только
   * проигранный целиком, в оба конца.
   *
   * Заведено 2026-08-17 по правке владельца: переходы в подвале «должны тоже
   * как-то анимированно открывать кейсы, а то там просто статика; предлагаю
   * использовать анимацию как сейчас при вызове меню с кейсами». Нового движения
   * не появилось — `SheetCurtain` умеет оба направления с 14 августа, здесь они
   * просто соединены в одну дорогу.
   */
  | { kind: "curtain-through"; word: string }
  /** Подмена без движения: экран либо уходит своей exit-анимацией, либо меняется сразу. */
  | { kind: "cut" }

function moveFor(from: Screen, to: Screen): Move {
  if (from.kind === "company" && to.kind === "case" && from.companyId === to.companyId) {
    return { kind: "curtain-out", word: WORDMARK[from.companyId] }
  }
  /*
   * 🔴 Условие «кейс другой» обязательно: без него повторное нажатие на тот же
   * адрес крутило бы занавес на месте.
   */
  if (from.kind === "case" && to.kind === "case" && from.caseId !== to.caseId) {
    return { kind: "curtain-through", word: WORDMARK[to.companyId] }
  }
  if (from.kind === "case" && to.kind === "company" && from.companyId === to.companyId) {
    return { kind: "sheet-in", companyId: to.companyId }
  }
  if (from.kind === "home" && to.kind === "company") return { kind: "sheet-drop" }
  return { kind: "cut" }
}

export function PortfolioRoute() {
  const [screen, setScreen] = React.useState<Screen>(readAndCanonicalize)

  /*
   * Занавес — цветная плоскость поверх страницы, одна на оба направления.
   * Раньше состояний было два, и приходящее из них не сбрасывалось: оно
   * переживало возврат и на следующем кейсе уводило маршрут обратно (дефект
   * 2026-08-15, поймал владелец). Одно состояние такой ловушки не создаёт.
   */
  const [curtain, setCurtain] = React.useState<{
    /*
     * Направление живёт в состоянии, а не выводится из маршрута: на дороге
     * кейс → кейс одна и та же плоскость сначала приходит, потом уезжает, и
     * маршрут в этот момент уже сменился.
     */
    direction: "in" | "out"
    word: string
  } | null>(null)

  /*
   * Лист компании, приезжающий поверх кейса на возврате. Он и есть «занавес»
   * этого направления: тот же экран, тот же спуск, та же лесенка.
   */
  const [arrivingCompany, setArrivingCompany] = React.useState<CompanyId | null>(null)

  /*
   * Экран, который встанет ПОСЛЕ того, как приходящая плоскость закроет собой
   * страницу. Адрес к этому моменту уже сменился — так история браузера всегда
   * согласована, даже если человек прервёт движение на середине.
   */
  const pendingRef = React.useRef<Screen | null>(null)

  /*
   * Как показать синий экран компании: сразу открытым или спуском.
   *
   * Решает МАРШРУТ, а не вид: только здесь известно, откуда пришли. Спуск идёт
   * с главной (и нажатием, и кнопкой «вперёд»), а заход по ссылке и возврат с
   * кейса открывают экран сразу — иначе под уходящим занавесом видно, как
   * плоскость едет второй раз, и мелькает ряд имён.
   */
  const [sheetInstant, setSheetInstant] = React.useState(true)

  /*
   * Лист встаёт готовым, без лесенки: она только что отыграла в приехавшем
   * листе, и повтор читался бы как моргание текста на стыке. Сбрасывается на
   * любом следующем переходе — там лесенка снова нужна.
   */
  const [arrivedRevealed, setArrivedRevealed] = React.useState(false)

  /*
   * Текущий экран, доступный обработчикам без пересоздания колбэков: `navigate`
   * обязан знать, ОТКУДА идёт переход, а замыкание на `screen` пересобирало бы
   * все колбэки на каждом шаге.
   */
  const screenRef = React.useRef(screen)
  screenRef.current = screen

  const setScreenNow = React.useCallback((next: Screen) => {
    screenRef.current = next
    setScreen(next)
    // Переход между экранами всегда начинается сверху: иначе на длинной
    // странице кейса возврат к списку открывался бы в середине.
    window.scrollTo({ top: 0 })
  }, [])

  /**
   * Единственный вход для смены экрана — и для нажатий, и для кнопок браузера.
   *
   * Адрес к моменту вызова уже актуален: `go` меняет его перед вызовом, а
   * `popstate` приходит после того, как его сменил браузер.
   */
  const navigate = React.useCallback(
    (next: Screen) => {
      const from = screenRef.current

      /*
       * Движение прервано новым переходом — например, человек жмёт «назад»,
       * пока плоскость ещё идёт. Досматривать её незачем: показываем то, куда
       * он идёт сейчас, и без движения, чтобы не спорить с его же жестом.
       */
      if (pendingRef.current) {
        pendingRef.current = null
        setCurtain(null)
        setArrivingCompany(null)
        setArrivedRevealed(false)
        setSheetInstant(true)
        setScreenNow(next)
        return
      }

      const move = moveFor(from, next)

      if (move.kind === "sheet-in") {
        /*
         * Экран пока НЕ меняем: сначала лист приедет поверх кейса. Пока он
         * едет, внутри него идёт обычная лесенка — поэтому текст встаёт к
         * приходу цвета, ровно как при открытии с главной.
         */
        setArrivingCompany(move.companyId)
        pendingRef.current = next
        return
      }

      if (move.kind === "curtain-out") {
        // Кейс встаёт сразу — плоскость уезжает уже с него.
        setArrivedRevealed(false)
        setCurtain({ direction: "out", word: move.word })
        setScreenNow(next)
        return
      }

      if (move.kind === "curtain-through") {
        /*
         * Экран пока НЕ меняем — как на дороге возврата: сначала плоскость
         * закроет собой старый кейс, и только под ней встанет новый. Иначе
         * подмена была бы видна сквозь ещё не закрывшийся занавес.
         */
        setArrivedRevealed(false)
        setCurtain({ direction: "in", word: move.word })
        pendingRef.current = next
        return
      }

      setCurtain(null)
      setArrivedRevealed(false)
      setSheetInstant(move.kind !== "sheet-drop")
      setScreenNow(next)
    },
    [setScreenNow],
  )

  const go = React.useCallback(
    (path: string) => {
      window.history.pushState({}, "", href(path))
      navigate(readAndCanonicalize())
    },
    [navigate],
  )

  React.useEffect(() => {
    const onPopState = () => navigate(readAndCanonicalize())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [navigate])

  // У главной компании в состоянии нет — ряд имён стоит закрытым.
  const company =
    screen.kind === "company" || screen.kind === "case" ? companyById(screen.companyId) : undefined
  const study = screen.kind === "case" && company ? caseById(company, screen.caseId) : undefined

  const openHome = React.useCallback(() => go(""), [go])

  /*
   * Плоскость доехала.
   *
   * На УХОДЕ она просто снимается: кейс под ней уже стоит. На ПРИХОДЕ (дорога
   * кейс → кейс) под ней в этот кадр встаёт новый кейс, и та же плоскость
   * разворачивается на уход — одним обновлением, чтобы на стыке не мигнуло.
   */
  const finishCurtain = React.useCallback(() => {
    const pending = pendingRef.current
    if (pending && pending.kind === "case") {
      pendingRef.current = null
      setScreenNow(pending)
      setCurtain((current) =>
        current ? { direction: "out", word: current.word } : null,
      )
      return
    }
    setCurtain(null)
  }, [setScreenNow])

  /*
   * Приехавший лист отдаёт экран маршруту.
   *
   * Подмена идёт ОДНИМ обновлением: в этот же кадр приезжий лист снимается, а
   * на его месте встаёт настоящий — с тем же содержимым и уже без лесенки
   * (`revealed`), иначе текст моргнул бы на стыке.
   */
  const finishArrival = React.useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    setArrivedRevealed(true)
    setSheetInstant(true)
    setArrivingCompany(null)
    setScreenNow(pending)
  }, [setScreenNow])

  const curtainNode = curtain ? (
    <SheetCurtain
      direction={curtain.direction}
      /*
       * Ключ по направлению — иначе framer-motion считает пришедшую и уходящую
       * плоскость одним узлом и на развороте не перезапускает движение: занавес
       * замирал бы закрытым.
       */
      key={curtain.direction}
      onDone={finishCurtain}
      wordmark={curtain.word}
    />
  ) : null

  const arrivingSheet = arrivingCompany ? (
    <ArchiveSheet
      company={archiveCompanies.find((item) => item.id === arrivingCompany)}
      onClose={openHome}
      onOpenCase={(companyId, caseId) => go(`${companyId}/case/${caseId}`)}
      onOpened={finishArrival}
    />
  ) : null

  if (screen.kind === "case" && company && study) {
    return (
      <>
        <PortfolioCaseView
          caseStudy={study}
          company={company}
          onHome={openHome}
          onOpenCase={(caseId) => go(`${company.id}/case/${caseId}`)}
          /*
            🔴 Возврат ведёт на РАБОТЫ СВОЕЙ КОМПАНИИ (`/a3`), а не на главную.
            Решение владельца: человек ушёл в кейс с синего экрана компании и
            возвращается к её же кейсам. На главную с кейса ведёт вторая строка
            шапки — «портфолио · 2026».

            Движением занимается `navigate`: он же отработает и на кнопке
            «назад», ведущей той же дорогой.
          */
          onOpenCompany={() => go(company.id)}
        />
        {curtainNode}
        {arrivingSheet}
      </>
    )
  }

  /*
   * Всё остальное — главная и работы компании: один вид в двух состояниях.
   * Сюда же приходит снисходительный разбор адреса: неизвестный идентификатор
   * показывает главную, а не пустой экран.
   */
  return (
    <>
      {/*
        Заглушки на время подгрузки здесь больше нет: вид приходит общим
        бандлом и рисуется первым же кадром. Пока он был ленивым, на её месте
        стояло полотно того цвета, который человек сейчас увидит, — кобальт на
        адресе компании и чернила на главной, чтобы вместо экрана не мелькала
        чужая вспышка.
      */}
      <PortfolioArchiveView
        /*
          Вид УПРАВЛЯЕМЫЙ: и раскрытая компания, и способ её показать приходят
          снаружи. Внутри вида этого знания нет — только маршрут знает, откуда
          человек пришёл, а до 2026-08-15 вид гадал об этом по факту нажатия и
          расходился с адресом.
        */
        companyId={screen.kind === "company" ? screen.companyId : undefined}
        instant={sheetInstant}
        onCloseCompany={openHome}
        revealed={arrivedRevealed}
        onOpenCase={(openedCompanyId, caseId) => go(`${openedCompanyId}/case/${caseId}`)}
        onOpenCompany={(openedCompanyId) => go(openedCompanyId)}
      />
      {/*
        Занавес живёт и здесь: возврат с кейса меняет экран на работы компании,
        когда плоскость уже закрыла страницу, — и доигрывает она уже над этим
        экраном.
      */}
      {curtainNode}
    </>
  )
}
