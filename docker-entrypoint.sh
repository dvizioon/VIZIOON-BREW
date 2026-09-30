#!/bin/sh
set -eu
mkdir -p /data

storage="${LOCAL_STORAGE_PATH:-./storage}"
case "$storage" in
  /*) ;;
  *) storage="/app/${storage#./}" ;;
esac
mkdir -p "$storage"

prisma migrate deploy --schema=/app/prisma/schema.prisma
exec node /app/server.js
