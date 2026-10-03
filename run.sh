#!/bin/bash
cd "$(dirname "$0")/backend"
export PATH="${HOME}/.local/bin:${PATH}"
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}" "$@"
