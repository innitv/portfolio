# -*- coding: utf-8 -*-
"""
Защитник: файл с доступами к хостингу не читается и не показывается.

В `.env.portfolio-deploy` лежат логин и пароль FTP. Они нужны скриптам выгрузки,
но не нужны ни в контексте разговора, ни в выводе команды: всё, что прочитано,
рано или поздно оказывается в тексте ответа, в логе задачи или в отчёте.

Хук закрывает два пути: чтение файла инструментом и вывод его содержимого
командой (`cat`, `type`, `Get-Content`). Записи он не запрещает — файл создают и
правят, просто не читая вслух.

Проверить заполненность можно, не раскрывая значений: скрипт, который печатает
длину и признак «заглушка из примера», — в `tools/`.
"""
import json
import re
import sys

SECRET = ".env.portfolio-deploy"

# Команды, которые высыпают файл в вывод. `grep` и `sed` сюда же: их часто зовут
# «посмотреть одну строку», а строка — как раз с паролем.
DUMPERS = (
    "cat", "type", "more", "less", "head", "tail",
    "grep", "sed", "awk", "get-content", "gc",
)


def dumps_secret(command: str) -> bool:
    """
    Опасно ли звено команды.

    🔴 Разбор по звеньям, а не поиск по всей строке. Первая версия ловила имя
    файла где угодно — и заблокировала команду, где оно лежало внутри `echo`
    как тестовые данные. Звено опасно, только если САМО начинается с выводящей
    команды и содержит имя файла.
    """
    for chunk in re.split(r"&&|\|\||[|;&\n]", command.replace("\\", "/")):
        words = chunk.strip().split()
        if not words or SECRET not in chunk:
            continue
        head = words[0].lstrip("(").rsplit("/", 1)[-1].lower()
        if head in DUMPERS:
            return True
    return False


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0

    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if tool in ("Read", "NotebookRead"):
        path = str(tool_input.get("file_path", "")).replace("\\", "/")
        if path.endswith(SECRET):
            print(
                f"{SECRET} содержит логин и пароль FTP — читать его не нужно.\n"
                "Скриптам выгрузки он доступен и так; для проверки заполненности "
                "есть разбор, который печатает только длину полей.",
                file=sys.stderr,
            )
            return 2

    if tool in ("Bash", "PowerShell"):
        command = str(tool_input.get("command", ""))
        if dumps_secret(command):
            print(
                f"Команда выводит содержимое {SECRET} — там пароль FTP.\n"
                "Читай из него значения программой, которая их не печатает.",
                file=sys.stderr,
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
