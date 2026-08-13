import * as React from "react";

import { useSmoothScroll } from "@/components/portfolio/use-smooth-scroll";

import {
  contacts,
  type CaseDetailSection,
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
 */
const LEAD_MAX = 180;

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

  const sections = caseStudy.detailSections ?? [];

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
          <button
            className="pc-back"
            data-testid="pc-back"
            onClick={onOpenCompany}
            type="button"
          >
            ← {company.name} · все работы
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

        <header className="pc-head">
          <div className="pc-index">
            {caseStudy.index} · {caseStudy.type}
          </div>
          <h1 className="pc-title" data-testid="pc-title">
            {caseStudy.title}
          </h1>
          <p className="pc-lede">{caseStudy.subtitle}</p>
          {caseStudy.impact ? (
            <div className="pc-impact-line">{caseStudy.impact}</div>
          ) : null}
        </header>

        {caseStudy.coverImage ? (
          <div className="pc-shots" data-testid="pc-hero" data-wide="true">
            <figure className="pc-shot">
              <div className="pc-shot-frame">
                <img
                  alt={caseStudy.coverImage.alt}
                  loading="eager"
                  src={caseStudy.coverImage.src}
                />
              </div>
              <figcaption>{caseStudy.coverImage.caption}</figcaption>
            </figure>
          </div>
        ) : null}

        {/*
          ─── ФАКТЫ СТРОКОЙ, А НЕ КОЛОНКОЙ ──────────────────────────────────
          Липкая колонка слева прожила один показ и снята владельцем: «лишняя
          информация, отвлекает». Возражение по делу — колонка держала в поле
          зрения то, что человек уже прочитал в шапке, и весь текст при этом
          уезжал к середине экрана.

          Теперь факты стоят один раз строкой под героем, а текст идёт от левого
          поля. Это ближе и к кадру 82:206, и к wemakefab: у обоих факты живут в
          шапке кейса, а не сопровождают чтение.
        */}
        <div className="pc-facts" data-testid="pc-facts">
          <div className="pc-fact">
            <div className="pc-label">Клиент</div>
            <div className="pc-value">{company.name}</div>
          </div>
          <div className="pc-fact">
            <div className="pc-label">Год</div>
            <div className="pc-value">{caseStudy.year}</div>
          </div>
          <div className="pc-fact">
            <div className="pc-label">Срок</div>
            <div className="pc-value">{caseStudy.duration}</div>
          </div>
          <div className="pc-fact">
            <div className="pc-label">Работа</div>
            <div className="pc-value">{caseStudy.type}</div>
          </div>
        </div>

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
            <p className="pc-lead" data-testid="pc-lead">
              {caseStudy.summary}
            </p>
            <p className="pc-section-text">{caseStudy.context}</p>

            <section className="pc-section" data-testid="pc-problem">
              <div className="pc-label">Задача</div>
              <p className="pc-lead">{caseStudy.problem}</p>
            </section>

            {sections.map((section) => {
              const shots = sectionShots(section);
              /*
                Первый абзац раздела идёт тезисом, если он короткий. Так поток
                разбивается перепадом кегля каждые несколько абзацев — у образца
                тезис приходится на каждые семь-восемь блоков текста. Длинный
                первый абзац остаётся обычным: крупным кеглем он занял бы
                пол-экрана и перестал быть акцентом.
              */
              const [first, ...restBody] = section.body ?? [];
              const leadFirst = Boolean(first && first.length <= LEAD_MAX);
              const paragraphs = leadFirst ? restBody : section.body ?? [];

              return (
                <React.Fragment key={section.title}>
                  <section className="pc-section">
                    <h2 className="pc-part">{section.title}</h2>
                    {leadFirst ? <p className="pc-lead">{first}</p> : null}
                    {paragraphs.map((paragraph) => (
                      <p className="pc-section-text" key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                    {section.items ? (
                      <ul className="pc-section-text">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {section.quote ? (
                      <p className="pc-lead">«{section.quote}»</p>
                    ) : null}
                  </section>

                  {shots.length ? (
                    <div className="pc-shots" data-wide={shots.length === 1}>
                      {shots.map((shot) => (
                        <figure className="pc-shot" key={shot.src}>
                          <div className="pc-shot-frame">
                            <img alt={shot.alt} loading="lazy" src={shot.src} />
                          </div>
                          <figcaption>{shot.caption}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}

            {/* Строками с линиями — приём «Что под капотом» из кадра владельца. */}
            <div className="pc-rows" data-testid="pc-rows">
              <div className="pc-row">
                <div className="pc-label">Что сделал</div>
                <ul>
                  {caseStudy.solution.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="pc-row">
                <div className="pc-label">Результат</div>
                <ul>
                  {caseStudy.result.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/*
          Кобальтовая плоскость — та же, что приходит синим экраном компании на
          `/archive`. Числа берутся из данных как есть: разбирать проценты из
          фраз регуляркой значило бы придумывать метрики, которых в кейсе нет.
        */}
            <section className="pc-impact" data-testid="pc-impact">
              <div className="pc-label pc-label--on-cobalt">Итог</div>
              <div className="pc-impact-grid">
                {caseStudy.result.map((item) => (
                  <div key={item}>
                    <div className="pc-metric-value">{caseStudy.impact}</div>
                    <div className="pc-metric-caption">{item}</div>
                  </div>
                ))}
              </div>
            </section>

            {next && next.id !== caseStudy.id ? (
              <nav className="pc-next" data-testid="pc-next">
                <div className="pc-label">Следующий кейс</div>
                <button
                  className="pc-next-card"
                  onClick={() => onOpenCase?.(next.id)}
                  style={{ marginBlockStart: 20 }}
                  type="button"
                >
                  <span className="pc-next-title">{next.title}</span>
                  <span className="pc-next-meta">
                    {next.year} · {next.impact}
                  </span>
                </button>
              </nav>
            ) : null}
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
