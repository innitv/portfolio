# -*- coding: utf-8 -*-
"""
Проверка защитников: каждый обязан и сработать, и НЕ сработать где не надо.

Случаи подобраны парами — опасное действие и похожее безобидное. Без второй
половины защитник легко оказывается слишком широким: первая версия защитника
секретов блокировала команду, где имя файла лежало внутри тестовых данных.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SECRET = ".env" + ".portfolio-deploy"  # склейка, чтобы не ловить самого себя

CASES = [
    # (хук, ввод, ожидаемый код, что проверяем)
    ("guard-generated.py",
     {"tool_name": "Edit", "tool_input": {"file_path": "src/views/portfolio-images.generated.ts"}},
     2, "правка сгенерированного манифеста"),
    ("guard-generated.py",
     {"tool_name": "Edit", "tool_input": {"file_path": "src/views/portfolio.data.ts"}},
     0, "правка обычных данных"),
    ("guard-secrets.py",
     {"tool_name": "Read", "tool_input": {"file_path": f"C:/Project/siteportfolio/{SECRET}"}},
     2, "чтение файла с паролем"),
    ("guard-secrets.py",
     {"tool_name": "Read", "tool_input": {"file_path": f"{SECRET}.example"}},
     0, "чтение шаблона без пароля"),
    ("guard-secrets.py",
     {"tool_name": "Bash", "tool_input": {"command": f"cat {SECRET}"}},
     2, "вывод файла целиком"),
    ("guard-secrets.py",
     {"tool_name": "Bash", "tool_input": {"command": f"grep PASSWORD {SECRET}"}},
     2, "вывод одной строки с паролем"),
    ("guard-secrets.py",
     {"tool_name": "Bash", "tool_input": {"command": f"ls -la {SECRET}"}},
     0, "просмотр размера файла"),
    ("guard-secrets.py",
     {"tool_name": "Bash", "tool_input": {"command": f"echo 'cat {SECRET}' > note.txt"}},
     0, "имя файла внутри строки, а не вызова"),
    ("guard-secrets.py",
     {"tool_name": "Bash", "tool_input": {"command": "python tools/upload-portfolio-ftp.py"}},
     0, "скрипт, который читает доступы сам"),
]

failures = 0
for hook, payload, expected, title in CASES:
    result = subprocess.run(
        [sys.executable, f".claude/hooks/{hook}"],
        capture_output=True, cwd=ROOT, input=json.dumps(payload), text=True, timeout=30,
    )
    mark = "ok " if result.returncode == expected else "FAIL"
    if result.returncode != expected:
        failures += 1
    print(f"[{mark}] {title:42} kod {result.returncode}, zhdali {expected}")

print()
print("proval:" if failures else "vse sluchai proshli:", failures or len(CASES))
sys.exit(1 if failures else 0)
