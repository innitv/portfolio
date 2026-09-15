# -*- coding: utf-8 -*-
"""
Выгрузка сайта на хостинг по одному FTP-соединению.

🔴 ЗАЧЕМ РЯДОМ С `deploy-portfolio-regru.mjs`. Тот поднимает отдельный процесс
`curl` на КАЖДЫЙ файл: 522 файла — это 522 новых TCP-соединения, логина и
завершения сессии подряд. Замер 15.09.2026: около пятнадцати файлов в минуту,
то есть больше получаса на полную выгрузку, из которых почти всё — накладные
расходы на соединение. Здесь соединение одно на весь прогон.

🔴 ЗАЛИВАЕТСЯ ТОЛЬКО ИЗМЕНИВШЕЕСЯ. Перед отправкой размер файла сверяется с
размером на сервере; совпал — файл пропускается. Поэтому прерванную выгрузку
можно продолжить, а повторный запуск почти ничего не делает.

Скрипт НИЧЕГО НЕ УДАЛЯЕТ на сервере — как и прежний. Файл, снятый из
репозитория, остаётся на хостинге, пока его не уберут руками.

Запуск: `yarn upload` (после `yarn build && yarn prerender`).
"""
import io
import os
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
ENV = ROOT / ".env.portfolio-deploy"


def read_env() -> dict[str, str]:
    if not ENV.exists():
        sys.exit(f"Нет файла доступов: {ENV}")

    values: dict[str, str] = {}
    for line in io.open(ENV, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


def connect(env: dict[str, str]) -> FTP:
    protocol = env.get("PORTFOLIO_FTP_PROTOCOL", "ftp").lower()
    client = FTP_TLS() if protocol == "ftps" else FTP()
    client.connect(env["PORTFOLIO_FTP_HOST"], int(env.get("PORTFOLIO_FTP_PORT", 21)), timeout=40)
    client.login(env["PORTFOLIO_FTP_USER"], env["PORTFOLIO_FTP_PASSWORD"])
    if isinstance(client, FTP_TLS):
        client.prot_p()
    client.sendcmd("TYPE I")
    return client


def ensure_dir(client: FTP, path: str, known: set[str]) -> None:
    """Создаёт папку и всех её родителей; уже созданные помнит, чтобы не спрашивать дважды."""
    if path in known or path in ("", "."):
        return

    parent = os.path.dirname(path)
    if parent:
        ensure_dir(client, parent, known)

    try:
        client.mkd(path)
    except error_perm as error:
        # 550 — папка уже есть; остальное настоящая ошибка.
        if not str(error).startswith("550"):
            raise
    known.add(path)


def main() -> None:
    if not (DIST / "index.html").exists():
        sys.exit("dist/index.html не найден — сначала `yarn build && yarn prerender`")

    env = read_env()
    remote_root = env["PORTFOLIO_FTP_REMOTE_DIR"].rstrip("/")
    client = connect(env)
    client.cwd(remote_root)

    files = sorted(p for p in DIST.rglob("*") if p.is_file())
    known_dirs: set[str] = set()
    sent = skipped = 0
    sent_bytes = 0

    for path in files:
        relative = path.relative_to(DIST).as_posix()
        folder = os.path.dirname(relative)
        if folder:
            ensure_dir(client, folder, known_dirs)

        local_size = path.stat().st_size
        try:
            if client.size(relative) == local_size:
                skipped += 1
                continue
        except error_perm:
            pass  # файла на сервере нет — заливаем

        with open(path, "rb") as source:
            client.storbinary(f"STOR {relative}", source)
        sent += 1
        sent_bytes += local_size

        if sent % 25 == 0:
            print(f"  залито {sent}, пропущено {skipped}")

    client.quit()
    print(f"Готово: залито {sent} ({sent_bytes / 1024 / 1024:.1f} МБ), пропущено без изменений {skipped}")


if __name__ == "__main__":
    main()
