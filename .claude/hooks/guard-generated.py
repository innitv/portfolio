# -*- coding: utf-8 -*-
"""
Защитник: сгенерированные файлы не правятся руками.

🔴 Зачем хук, если правило уже написано в CLAUDE.md. Потому что правило читают
один раз, а нарушают в момент, когда «надо быстро дописать один ключ». Так в
манифест кадров не раз добавляли строки вручную — и он расходился с папкой
`public/assets/optimized`, пока следующий запуск генератора молча их не стирал.

Файл пересобирается командой, которая указана в сообщении. Хук возвращает код 2:
для Claude Code это «действие запрещено, причина в stderr».
"""
import json
import sys
from pathlib import PurePath

# Файл → чем он собирается.
GENERATED = {
    "src/views/portfolio-images.generated.ts": "yarn images",
}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0  # Непонятный ввод — не мешаем работе.

    tool_input = payload.get("tool_input") or {}
    raw_path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not raw_path:
        return 0

    path = PurePath(str(raw_path).replace("\\", "/"))
    for generated, command in GENERATED.items():
        if path.as_posix().endswith(generated):
            print(
                f"{generated} — сгенерированный файл, руками не правится.\n"
                f"Пересобери его командой: {command}\n"
                "Если менять надо содержимое, а не файл, — правь источник: "
                "картинки в public/assets/optimized или сам генератор в tools/.",
                file=sys.stderr,
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
