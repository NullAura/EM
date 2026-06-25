#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${REPO_ROOT:-$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || pwd)}"
python_bin="${PYTHON:-$repo_root/.venv/bin/python}"

if [ ! -x "$python_bin" ]; then
    python_bin=python3
fi

# 启动服务器
echo "启动API服务器..."
cd "$repo_root"
export PYTHONPATH="$repo_root:${PYTHONPATH:-}"
export PORT="${PORT:-5002}"
"$python_bin" -m backend.api.server
