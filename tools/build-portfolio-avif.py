# -*- coding: utf-8 -*-
"""
AVIF рядом с каждым webp — и перегенерация манифеста кадров.

🔴 ЗАЧЕМ. Кадры — самое тяжёлое на сайте: 6.9 МБ webp против 433 КБ кода.
Замер на наших файлах при качестве 65: −21 % на плотном интерфейсном
скриншоте, −53 % на карте опций, в среднем около трети. Качество сверялось
глазами на фрагменте с мелким текстом (история операций, кегль 12) — разницы
с webp не видно.

🔴 ПОЧЕМУ НЕ ЗАМЕНА, А ДОБАВЛЕНИЕ. AVIF поддерживают 95 % браузеров, нижняя
граница — Safari 16.4. Это ровно тот пол, который сайт уже держит (Tailwind 4
требует Safari 16.4), но webp остаётся резервом: `<picture>` сам выберет, а
сломаться от лишнего файла нечему.

🔴 ПОЧЕМУ ЭТОТ СКРИПТ, А НЕ `optimize-portfolio-media.py`. Тот читает
`REPO_ROOT/apps/portfolio/...` и `siteportfolio/src/PortfolioView.tsx` — путей,
которых нет с переноса на новую вёрстку 2026-08-03. Он мёртв; здесь конвейер
собран заново под сегодняшнюю структуру.

Запуск: `python tools/build-portfolio-avif.py`. Скрипт идемпотентен — уже
собранные AVIF пропускаются, если они свежее исходного webp.
"""
import io
import os
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OPTIMIZED = ROOT / "public" / "assets" / "optimized"
MANIFEST = ROOT / "src" / "views" / "portfolio-images.generated.ts"

QUALITY = 65
SPEED = 5


def build_avif() -> tuple[int, int, int]:
    """Возвращает: собрано, пропущено, сэкономлено байт."""
    made = skipped = saved = 0

    for source in sorted(OPTIMIZED.glob("*.webp")):
        target = source.with_suffix(".avif")
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            skipped += 1
            continue

        image = Image.open(source).convert("RGB")
        image.save(target, format="AVIF", quality=QUALITY, speed=SPEED)
        made += 1
        saved += source.stat().st_size - target.stat().st_size
        print(f"  {source.name}: {target.stat().st_size // 1024} KB")

    return made, skipped, saved


def write_manifest() -> int:
    """
    Манифест — единственный источник правды о доступных ширинах и форматах.

    Ключ — базовое имя без суффикса ширины; значения — ширины по возрастанию и
    признак, есть ли AVIF во ВСЕХ этих ширинах. Частичного набора не бывает:
    `<picture>` выбирает формат один раз на весь `srcset`, и пропуск одной
    ширины дал бы кадр, которого нет.
    """
    widths: dict[str, set[int]] = {}
    avif: dict[str, set[int]] = {}

    for file in OPTIMIZED.iterdir():
        match = re.fullmatch(r"(.+)-(\d+)\.(webp|avif)", file.name)
        if not match:
            continue
        key, width, kind = match.group(1), int(match.group(2)), match.group(3)
        (widths if kind == "webp" else avif).setdefault(key, set()).add(width)

    rows = []
    for key in sorted(widths):
        sizes = sorted(widths[key])
        full = avif.get(key, set()) >= set(sizes)
        rows.append(
            f'  "{key}": {{ widths: [{", ".join(str(w) for w in sizes)}]'
            + (", avif: true" if full else "")
            + " },"
        )

    header = f'''/**
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

export interface OptimizedImage {{
  /** Доступные ширины по возрастанию. */
  widths: number[]
  /** AVIF собран во всех этих ширинах. */
  avif?: true
}}

export const optimizedImages = {{
'''

    body = "\n".join(rows)
    footer = """
} as const satisfies Record<string, OptimizedImage>

export type OptimizedImageKey = keyof typeof optimizedImages
"""

    text = header + body + footer
    newline = "\r\n" if "\r\n" in io.open(MANIFEST, encoding="utf-8", newline="").read() else "\n"
    io.open(MANIFEST, "w", encoding="utf-8", newline="").write(text.replace("\n", newline))
    return len(rows)


if __name__ == "__main__":
    if not OPTIMIZED.is_dir():
        sys.exit(f"Нет папки кадров: {OPTIMIZED}")

    made, skipped, saved = build_avif()
    keys = write_manifest()

    print(f"AVIF: собрано {made}, пропущено {skipped}, экономия {saved / 1024 / 1024:.2f} МБ")
    print(f"Манифест: {keys} ключей")
