import * as React from "react"

/**
 * Заливка полосы Archive: живой пиксельный растр.
 *
 * Выбор владельца 14.09.2026 из трёх показанных вариантов (растр, световые
 * дорожки, мягкое свечение) — и он же попросил приглушить свет: клетка должна
 * читаться, но не спорить со словом поверх неё.
 *
 * 🔴 ЭТО НЕ ШЁЛК С ЛЕНДИНГА. Первый заход перенёс сюда шейдер складок ткани из
 * `a3pay-landing` (`HeroSilk.tsx`); на широкой ленте его четыре гребня
 * вытягивались в прямые, и владелец отклонил: «на больших экранах какие-то
 * палки». Растр придуман под саму полосу: у неё отношение сторон 5 к 1, и
 * квадратная клетка держит любую ширину без растяжения.
 *
 * Клетка в характере сайта: болид пасхалки набран пикселями, а финишный флаг,
 * снятый 2026-09-10, был клетчатым. Свет идёт по диагонали, у каждого квадрата
 * своя задержка от хеша — волна не читается линейкой.
 *
 * 🔴 Цвета числами: GLSL компилируется в GPU и CSS-переменных не видит. Числа —
 * те же ступени кобальта, что в слое токенов.
 *
 * WebGL без библиотек: один полноэкранный треугольник, 30 кадров в секунду,
 * кадр считается только пока полоса в экране и вкладка видна.
 */

const VERT = `
attribute vec2 p;
varying vec2 v;
void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`

const PALETTE = `
const vec3 INK    = vec3(0.043, 0.043, 0.043);  /* #0b0b0b */
const vec3 COBALT = vec3(0.016, 0.290, 0.702);  /* #044ab3 */
const vec3 SHADE  = vec3(0.173, 0.404, 0.749);  /* #2c67bf */
const vec3 MID    = vec3(0.408, 0.573, 0.820);  /* #6892d1 */
const vec3 LIGHT  = vec3(0.608, 0.718, 0.882);  /* #9bb7e1 */
const vec3 PALE   = vec3(0.804, 0.859, 0.941);  /* #cddbf0 */
const vec3 SNOW   = vec3(0.969, 0.973, 0.980);  /* #f7f8fa */
`

const FRAG_RASTER = `
precision highp float;
varying vec2 v;
uniform float t;
uniform float boot;   /* сборка полосы: 0 — пусто, 1 — собрана целиком */
uniform vec2 res;
${PALETTE}

float hash(vec2 c){ return fract(sin(dot(c, vec2(41.3, 289.1))) * 43758.5453); }

void main(){
  /* клетка квадратная в пикселях экрана, а не в долях полотна */
  float cell = 26.0;
  vec2 px = v * res;
  vec2 c = floor(px / cell);
  vec2 f = fract(px / cell);

  /* волна идёт по диагонали; у каждой клетки своя задержка от хеша */
  float wave = sin((c.x * 0.55 - c.y * 0.35) * 0.42 - t * 1.15);
  float lit = smoothstep(-0.1, 0.95, wave) * (0.65 + 0.35 * hash(c));

  /* зазор между квадратами: клетка читается как клетка */
  float gap = step(0.06, f.x) * step(0.06, f.y) * step(f.x, 0.94) * step(f.y, 0.94);

  /*
   * 🔴 Свет возвращён на полную по правке владельца 14.09.2026: приглушение
   * держалось ровно до того, как слово «Archive» перестало лежать на ленте
   * поверх растра. Теперь оно вырезано в ней, спорить растру не с чем, и
   * клетка снова видна в полную силу.
   */
  vec3 col = mix(COBALT, SHADE, 0.35 + 0.2 * hash(c + 7.0));
  col = mix(col, MID, lit * 0.8);
  col = mix(col, PALE, smoothstep(0.75, 1.0, lit) * 0.85);
  col = mix(COBALT * 0.82, col, gap);

  /*
   * ─── ПОЛОСА СОБИРАЕТСЯ ПО КВАДРАТИКАМ ────────────────────────────────────
   *
   * Правка владельца 14.09.2026: «полоса собирается по квадратикам» и «пиксели
   * появляются слева направо, как генерация полосы из пикселей».
   *
   * Поэтому порог почти целиком задан местом клетки по горизонтали — фронт
   * идёт слева направо ровно за белой полоской сверху, — а хеш оставлен лишь
   * на пятую часть: он рвёт край фронта, чтобы лента набиралась квадратами, а
   * не выезжала сплошной шторкой.
   *
   * Квадрат появляется сразу целиком: это сборка из кубиков, а не проявление.
   */
  float slot = v.x * 0.82 + hash(c + 3.0) * 0.18;
  float shown = step(slot, boot);

  gl_FragColor = vec4(col, shown);
}
`

export function StripeRaster() {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false })
    if (!gl) return

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG_RASTER))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uT = gl.getUniformLocation(prog, "t")
    const uBoot = gl.getUniformLocation(prog, "boot")
    const uRes = gl.getUniformLocation(prog, "res")
    let raf = 0
    let visible = true
    /*
     * 🔴 ОТСЧЁТ СБОРКИ ИДЁТ ОТ ПЕРВОГО ВИДИМОГО КАДРА, А НЕ ОТ МОНТИРОВАНИЯ.
     *
     * Дефект владельца 14.09.2026: «идёшь с главной в кейсы, в кейс, назад к
     * кейсам и на главную — синяя строка не грузится, только белая, а потом
     * синяя появляется внезапно».
     *
     * Причина: пока полосу закрывает плоскость компании или страница кейса,
     * полотно не рисует (см. проверку перекрытия ниже) — а время от
     * монтирования шло, и к моменту, когда полоса открывалась, сборка была уже
     * позади. Белая кромка при этом честно шла заново: у неё CSS-анимация,
     * и она стартует вместе с узлом.
     */
    let start = 0
    /*
     * Сборка длится 0.9 с — столько же, сколько лесенка содержимого главной:
     * полоса набирается ровно пока проявляются строки вокруг неё, а не после.
     */
    const BOOT = 900
    const STEP = 1000 / 30
    let painted = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    /*
     * 🔴 ПОЛОСА В ЭКРАНЕ — ЕЩЁ НЕ ЗНАЧИТ ВИДНА. Синий экран компании и страница
     * кейса приходят поверх неё, и `IntersectionObserver` продолжает считать её
     * видимой: полотно рисовало кадры под непрозрачной плоскостью. На полном
     * прогоне приёмки это стоило миллисекунд там, где их мерят, — проверка
     * «занавес идёт в темпе открытия» падала на 1112 мс при пороге 1100.
     *
     * Перекрытие определяется точкой в середине полосы раз в четверть секунды:
     * чаще незачем, а дешевле этого способа нет.
     */
    let covered = false
    let checked = 0
    const checkCover = (now: number) => {
      /*
       * 🔴 Пока сборка не началась, перекрытие проверяется КАЖДЫЙ кадр.
       * С общим шагом в четверть секунды полоса после ухода плоскости стояла
       * пустой ещё до 300 мс: замер 14.09.2026 по возврату с кейса показал
       * пустое место на 830 мс и начало сборки только на 1430.
       */
      if (start && now - checked < 250) return covered
      checked = now
      const box = canvas.getBoundingClientRect()
      if (!box.width) return covered
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      covered = !hit || !canvas.parentElement?.contains(hit)
      return covered
    }

    const frame = () => {
      raf = 0
      if (!visible || document.hidden) return
      const now = performance.now()
      if (checkCover(now)) {
        raf = requestAnimationFrame(frame)
        return
      }
      /*
       * Первый кадр, на котором полосу видно, и есть начало сборки. Полоса
       * узнаёт об этом атрибутом: по нему трогается белая кромка, иначе её
       * CSS-анимация уходила вперёд — она стартует вместе с узлом, а полотно
       * ждало, пока плоскость откроет полосу.
       */
      if (!start) {
        start = now
        canvas.parentElement?.setAttribute("data-boot", "on")
      }
      const booting = now - start < BOOT
      if (booting || now - painted >= STEP) {
        painted = now
        resize()
        gl.uniform1f(uT, (now - start) / 1000)
        gl.uniform1f(uBoot, Math.min((now - start) / BOOT, 1))
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      kick()
    })
    io.observe(canvas)
    document.addEventListener("visibilitychange", kick)

    kick()

    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas aria-hidden="true" className="pa-silk" ref={ref} />
}
