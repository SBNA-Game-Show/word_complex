#!/bin/sh

exec gunicorn \
  --bind 0.0.0.0:${PORT:-7860} \
  --workers 1 \
  --timeout 120 \
  server:app