import * as React from "react";

import { useSmoothScroll } from "@/components/portfolio/use-smooth-scroll";

import {
  contacts,
  imageFallback,
  imageKeyFromSrc,
  imageSrcSet,
  type CaseDetailSection,
  type CaseImage,
  type CaseStudy,
  type Company,
} from "./portfolio.data";

import "@/styles/portfolio-case.css";

/**
 * Страница кейса в чернильной манере.
 *
 * ─── ОТКУДА СТРУКТУРА ───────────────────────────────────────────────────────
 * Из кадра владельца Figma `Hqqav4V81gZIxxH6AwSUWj`, узел **82:206** — он был
 * дан как структурный образец, не стилевой. Порядок блоков оттуда: имя → герой
 * → факты с описанием → показы парами с подписями → задача → таблица строками
 * → соседний проект. Манера — своя, с экрана `/archive`.
 *
 * Разбор десяти живых страниц кейсов, из которого взяты приёмы (и который
 * показал, чего у рынка нет), — `case-manner.md` в run-каталоге студии.
 *
 * ─── ЧТО ЗАМЕНИЛОСЬ ─────────────────────────────────────────────────────────
 * Прежняя страница была статьёй на shadcn-теме `portfolio`: светлая, в двух
 * колонках, с липкой правой колонкой контактов. Решение владельца 2026-08-13 —
 * заменить её, адреса сохранив: сайт по ним проиндексирован.
 *
 * ─── КОЛОНКА ФАКТОВ ЛИПКАЯ ──────────────────────────────────────────────────
 * Выбор владельца 2026-08-13 из двух собранных вариантов: факты держатся весь
 * скролл (приём `arestov.design`), а не уезжают вверх, как в кадре 82:206.
 * Отсюда и раскладка страницы двумя колонками — `position: sticky` держит
 * колонку только внутри родителя, и в коротком развороте она отпускалась.
 *
 * ─── ПОЛЕ СВЕТЛОЕ ───────────────────────────────────────────────────────────
 * Тоже решение владельца: кейс читают длинно, и чернила из `/archive` здесь
 * мешают. Разбор — в шапке `portfolio-case.css`.
 */

export interface PortfolioCaseViewProps {
  caseStudy: CaseStudy;
  company: Company;
  onHome: () => void;
  onOpenCase?: (caseId: string) => void;
  onOpenCompany: () => void;
}

/**
 * Показ страницы кейса.
 *
 * 🔴 Кадр берётся из ЛОКАЛЬНОГО манифеста, а не по внешнему URL из данных.
 * Оптимизированные webp в пяти ширинах лежат в `public/assets/optimized/`, но
 * до 2026-08-14 их подключал только `case-figure.tsx` — компонент старой темы,
 * которую с 13 августа не открывает ни один маршрут. Чернильная страница
 * рендерила `<img src={image.src}>` напрямую и тянула тяжёлые PNG с внешнего
 * домена: кадр «до» (2160 × 1350) не догружался за 2.5 с, локальный webp того
 * же размера весит 60 КБ.
 *
 * Внешний адрес остаётся резервом: кадра может не быть в манифесте, и тогда
 * лучше показать тяжёлый PNG, чем пустую рамку.
 */
function CaseShot({ eager, image }: { eager?: boolean; image: CaseImage }) {
  const key = imageKeyFromSrc(image.src);

  return (
    <figure className="pc-shot">
      <div className="pc-shot-frame">
        <img
          alt={image.alt}
          decoding="async"
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 899px) calc(100vw - 40px), min(1320px, calc(100vw - 120px))"
          src={key ? imageFallback(key) : image.src}
          srcSet={key ? imageSrcSet(key) : undefined}
        />
      </div>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}

/** Показы, вытащенные из секции: `image` и `images` приходят вперемешку. */
function sectionShots(section: CaseDetailSection) {
  const single = section.image ? [section.image] : [];
  return [...single, ...(section.images ?? [])];
}

/**
 * Длина, до которой абзац годится в тезис.
 *
 * У образца тезис — одно-два предложения; длинный абзац крупным кеглем занял бы
 * пол-экрана и перестал быть акцентом. 180 знаков — примерно две строки при
 * мере в 28 знаков, на которую настроен `.pc-lead`.
 *
 * Приём остался для семи кейсов, ещё не размеченных по макету 88:248: у них
 * тезиса в данных нет, и его приходится угадывать по первому абзацу. У
 * размеченного раздела (`kicker` + содержательный `title`) тезис задан явно, и
 * угадывать нечего.
 */
const LEAD_MAX = 180;

/**
 * ─── БЛОКИ ЧЕРЕДУЮТСЯ: ТРЕТЬ → ПОЛЕ → ТРЕТЬ ─────────────────────────────────
 * Правило снято координатами из макета 95:1004, а не выведено на глаз:
 *
 *   «О проекте»              left `calc(33.33% + 31)` = 671  → треть
 *   «Контекст»               left 60                        → поле
 *   «Проблемы до редизайна»  left 611 внутри блока на 60    → треть
 *
 * 🔴 Я дважды ошибался в этом месте, и оба раза потому, что смотрел на часть
 * макета. По первой редакции завёл чередование, по второй решил, что оно
 * отменено и смещён только вводный блок, — а в полном кадре видно, что
 * чередование есть, просто разделов в макете три, и второй из них стоит у поля.
 *
 * У «Проблем» смещены МЕТКА И ТЕЗИС, а нумерованный список остаётся от поля:
 * список сам держит две вертикали номером и текстом, и сдвигать его целиком
 * значило бы увести текст пункта на две трети ширины.
 */
function isShifted(textBlock: number): boolean {
  return textBlock % 2 === 0;
}

export function PortfolioCaseView({
  caseStudy,
  company,
  onHome,
  onOpenCase,
  onOpenCompany,
}: PortfolioCaseViewProps) {
  /*
   * Канва документа на время жизни страницы — тем же способом, что на
   * `/archive`: фон за боксом страницы виден у `html`, и красить его нужно
   * чернилами, иначе в системных зонах мобильного браузера светится тема.
   */
  React.useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.portfolioSurface;
    root.dataset.portfolioSurface = "case";

    return () => {
      if (previous === undefined) delete root.dataset.portfolioSurface;
      else root.dataset.portfolioSurface = previous;
    };
  }, []);

  /*
   * Мягкая прокрутка — приём образца `wemakefab.ru`. Включена только здесь:
   * страница кейса длинная (восемь тысяч пикселей), и инерция на ней читается;
   * на коротких страницах сайта она была бы задержкой ввода без причины.
   */
  useSmoothScroll();

  /*
    ─── НА СТРАНИЦЕ ТОЛЬКО ТО, ЧТО ЕСТЬ В МАКЕТЕ ─────────────────────────────
    Решение владельца 2026-08-14: «остальные блоки когда я доделаю я тебе скажу,
    а пока не надо вносить ничего своего». В макете `95:1004` текстовых разделов
    ровно два — «Контекст» и «Проблемы до редизайна», — и порядок их тоже
    оттуда.

    Остальные разделы данных («Цель», «Продуктовые гипотезы», «Что сделал»,
    «Метрики успеха», «Бизнес-эффект») из вида убраны, но НЕ удалены из данных:
    владелец дорисует макет и скажет, куда их вернуть.

    🔴 Список меток — единственное место, где задан состав страницы. Меняется он
    вместе с макетом и только по слову владельца.
  */
  const MACET_SECTIONS = ["Контекст", "Проблемы до редизайна"];

  const sections = (caseStudy.detailSections ?? []).filter((section) =>
    section.kicker ? MACET_SECTIONS.includes(section.kicker) : false,
  );

  /*
    Кадры для блока «О проекте» — пара мокапов из макета. В данных они лежат в
    разделе «Что сделал», который сейчас не показывается; забираем их оттуда,
    чтобы пара не пропала со страницы вместе с ним.
  */
  const introShots = (caseStudy.detailSections ?? [])
    .filter((section) => !MACET_SECTIONS.includes(section.kicker ?? ""))
    .flatMap(sectionShots)
    .slice(0, 2);

  /** Соседний кейс той же компании — увести дальше, а не оборвать страницу. */
  const next = React.useMemo(() => {
    const list = company.cases;
    const at = list.findIndex((item) => item.id === caseStudy.id);
    return list[(at + 1) % list.length];
  }, [company.cases, caseStudy.id]);

  return (
    <div className="pc-root" data-testid="pc-root">
      {/*
        Сетки-подложки здесь нет намеренно (снята 2026-08-13 по решению
        владельца). На `/archive` клетка — часть плаката и видна на чернилах
        как чертёжная разметка; на светлой странице с длинным текстом она
        превращается в разлинованную тетрадь и спорит со строками.
      */}
      <div className="pc-screen">
        <div className="pc-top">
          {/*
            🔴 «кейсы», а не «все работы». Обе строки шапки ведут вверх, но в
            разные места: эта — к кейсам своей компании, соседняя — на главную.
            Пока здесь стояло «← А3 · все работы», а на экране компании «← все
            работы», одинаковые слова означали два разных перехода: владелец
            нажимал здесь, ожидая главную, и попадал на синий экран компании —
            «с кобальта переносит на кобальт» (2026-08-15).
          */}
          <button
            className="pc-back"
            data-testid="pc-back"
            onClick={onOpenCompany}
            type="button"
          >
            ← кейсы {company.name}
          </button>
          <button
            className="pc-home"
            data-testid="pc-home"
            onClick={onHome}
            type="button"
          >
            портфолио · 2026
          </button>
        </div>

        {/*
          ─── ШАПКА КЕЙСА: ИМЯ И ЛИД, БОЛЬШЕ НИЧЕГО ─────────────────────────
          Состав из макета 95:1004, проверен по описи: над именем НЕТ ничего,
          под именем — один моноширинный лид, плашек нет.

          Что снято 2026-08-14 по разбору владельца: строка «I · UX Research ·
          Redesign» над именем («на моём макете над названием кейса нет никаких
          надписей») и кобальтовая плашка `impact` под лидом («нет никаких синих
          плашек»).

          Лид — `summary`, а не `subtitle`: в макете под именем стоит фраза
          «Главный экран стал рабочим дашбордом…», и это ровно `summary`.
        */}
        <header className="pc-head">
          <h1 className="pc-title" data-testid="pc-title">
            {caseStudy.title}
          </h1>
          <p className="pc-lede">{caseStudy.summary}</p>
        </header>

        {caseStudy.coverImage ? (
          <div className="pc-shots" data-testid="pc-hero" data-wide="true">
            <CaseShot eager image={caseStudy.coverImage} />
          </div>
        ) : null}

        {/*
          Блока фактов «Клиент / Год / Срок / Работа» здесь больше нет: в макете
          его нет, и владелец сказал об этом трижды (2026-08-14). Данные
          `year`, `duration`, `type` остаются в `portfolio.data.ts` — их читает
          карточка кейса на разводящей.
        */}
        <div className="pc-body" data-testid="pc-body">
          <div className="pc-flow">
            {/*
              ─── ТЕКСТ РАЗМЕЧЕН ПО РОЛЯМ, А НЕ ИДЁТ ОДНИМ КЕГЛЕМ ────────────
              До 2026-08-13 вся страница шла одним размером: 38 блоков из 66 в
              28 px одной ширины подряд. Владелец: «однообразный текст, всё
              сливается». Роли и их частота взяты с кейсов wemakefab.ru, где
              тезис вдвое с половиной крупнее текста открывает каждый раздел.

              Что чем стало: `summary` — тезис страницы, `problem` — тезис
              раздела «Задача», заголовки разделов данных — `pc-part`, остальное
              абзацы и списки основным кеглем.
            */}
            {/*
              ─── «О ПРОЕКТЕ» — ПЕРВЫЙ БЛОК МАКЕТА ───────────────────────────
              Устройство ровно как у разделов: метка → тезис → описание. В
              макете он стоит на трети ширины и открывает текст страницы.

              Блока «Задача» здесь больше нет: в макете его нет, а его тезис
              (`problem`) и есть тезис «О проекте». Раньше эти два блока стояли
              подряд и оба на трети, отчего сбивалась фаза чередования.
            */}
            <section
              className="pc-section"
              /*
                Вводный блок у́же смещённого раздела: в макете он 904 (шесть
                колонок), а тезис «Проблем» — 1036 (семь). Разница задана
                признаком, а не общим правилом для всех смещённых блоков.
              */
              data-intro="true"
              data-shift={isShifted(0)}
              data-testid="pc-problem"
            >
              <div className="pc-kicker">О проекте</div>
              <p className="pc-part" data-testid="pc-lead" data-thesis="true" data-tight="true">
                {caseStudy.problem}
              </p>
              <p className="pc-section-text">{caseStudy.context}</p>
            </section>

            {/*
              Пара кадров стоит СРАЗУ за «О проекте» — так в макете (мокапы на
              top 1780, между вводным блоком и «Контекстом»). Кадры принадлежат
              блоку, за которым идут, поэтому лежат в его данных.
            */}
            {introShots.length ? (
              <div className="pc-shots" data-testid="pc-intro-shots">
                {introShots.map((shot) => (
                  <CaseShot image={shot} key={shot.src} />
                ))}
              </div>
            ) : null}

            {sections.map((section, sectionIndex) => {
              const shots = sectionShots(section);
              /*
                Чередование продолжается за «О проекте»: он занял треть, значит
                первый раздел — «Контекст» — идёт от поля, как в макете.
              */
              const shifted = isShifted(sectionIndex + 1);
              /*
                Размеченный раздел несёт тезис в самом заголовке: `title` — это
                первое предложение содержания, набранное крупно (макет 88:248).
                Тогда угадывать нечего.

                У семи ещё не переразмеченных кейсов заголовок служебный
                («Контекст»), и тезисом становится первый короткий абзац — так
                поток разбивается перепадом кегля каждые несколько абзацев.
                Длинный первый абзац остаётся обычным: крупным кеглем он занял
                бы пол-экрана и перестал быть акцентом.
              */
              const marked = Boolean(section.kicker);
              const [first, ...restBody] = section.body ?? [];
              const leadFirst =
                !marked && Boolean(first && first.length <= LEAD_MAX);
              const paragraphs = leadFirst ? restBody : section.body ?? [];

              return (
                <React.Fragment key={section.title}>
                  <section className="pc-section" data-shift={shifted}>
                    {/*
                      Метка над тезисом: «Контекст», «Цель», «Итоги». Она
                      отвечает на вопрос «что это за блок», а крупная строка под
                      ней — уже содержание, а не название раздела.
                    */}
                    {section.kicker ? (
                      <div className="pc-kicker">{section.kicker}</div>
                    ) : null}
                    <h2
                      className="pc-part"
                      data-thesis={marked}
                      data-tight={marked}
                    >
                      {section.title}
                    </h2>
                    {leadFirst ? <p className="pc-lead">{first}</p> : null}
                    {paragraphs.map((paragraph) => (
                      <p className="pc-section-text" key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                    {/*
                      ─── ПУНКТЫ РАЗМЕЧЕННОГО РАЗДЕЛА — НУМЕРОВАННЫЙ СПИСОК ──
                      Вторая редакция макета 88:248 (владелец, 2026-08-14,
                      вечер): над каждым пунктом линия во всю ширину блока, под
                      ней номер у левого поля и текст на вертикали сдвига.

                      Номер СЧИТАЕТСЯ от порядка пункта, а не хранится в тексте:
                      в макете у «Проблем» пятый пункт подписан «4», и ручная
                      нумерация законсервировала бы эту опечатку.

                      Номер скрыт от диктора: список и без него объявляется
                      нумерованным, а видимая цифра прочиталась бы второй раз.

                      Пункты семи остальных кейсов остаются абзацами: у них нет
                      `kicker`, они не размечены по этому макету и трогать их
                      владелец не просил.
                    */}
                    {section.items ? (
                      marked ? (
                        <ol className="pc-items" data-testid="pc-items">
                          {section.items.map((item, order) => (
                            <li className="pc-item" key={item}>
                              <span aria-hidden="true" className="pc-item-num">
                                {order + 1}
                              </span>
                              <p className="pc-item-text">{item}</p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <ul className="pc-section-text">
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )
                    ) : null}
                    {section.quote ? (
                      <p className="pc-lead">«{section.quote}»</p>
                    ) : null}
                  </section>

                  {shots.length ? (
                    /*
                      `data-in-section` — не украшение: кадр раздела отбит от его
                      текста на 69 из макета (52 при 1440), а не на 240, как
                      самостоятельный блок. Кадр героя такого атрибута не несёт и
                      живёт своей отбивкой.
                    */
                    <div
                      className="pc-shots"
                      data-in-section="true"
                      data-wide={shots.length === 1}
                    >
                      {shots.map((shot) => (
                        <CaseShot image={shot} key={shot.src} />
                      ))}
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}

            {/*
              🔴 Здесь стояли таблица «Что сделал / Результат», кобальтовая
              плоскость «Итог» и переход на соседний кейс. Все три сняты
              2026-08-14: в макете `95:1004` их нет, а владелец сказал прямо —
              «остальные блоки когда я доделаю я тебе скажу, а пока не надо
              вносить ничего своего».

              Код и данные для них целы (`solution`, `result`, `impact`,
              соседний кейс считается тут же) — вернуть их будет правкой в
              несколько строк, когда макет дорисуют.
            */}
          </div>
        </div>

        {/*
          Страница не обрывается соседним кейсом: в кадре владельца её закрывает
          контакт, и без него читатель, дошедший до низа, упирается в пустоту.
          Подвал сайта сюда не подходит — он светлый и живёт на теме `portfolio`,
          поэтому здесь своя строка в той же манере, что шапка.
        */}
        <footer className="pc-foot" data-testid="pc-foot">
          <span>обсудить задачу</span>
          <span className="pc-foot-links">
            {contacts.map((channel) => (
              <a
                href={channel.href}
                key={channel.label}
                rel={channel.external ? "noreferrer" : undefined}
                target={channel.external ? "_blank" : undefined}
              >
                {channel.label}
              </a>
            ))}
          </span>
        </footer>
      </div>
    </div>
  );
}
