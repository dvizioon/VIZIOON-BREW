# shellcheck shell=bash
# Variáveis copiadas para docker/.env no deploy.
# No CI, o job define APP_PREFIX (development | production) e as vars
# vêm prefixadas: development_PORT, production_AUTH_URL, etc.

APP_ENV_KEYS=(
  APP_ENV
  NODE_ENV
  LOG_LEVEL
  LOG_PRETTY
  DB_HOST
  DB_PORT
  DB_NAME
  DB_USER
  DB_PASS
  DB_PREFIX
  DB_DIALECT
  DB_DEBUG
  PORT
  HOST
  HOSTNAME
  AUTH_SECRET
  AUTH_URL
  AUTH_TRUST_HOST
  SEED_MASTER_EMAIL
  SEED_MASTER_PASSWORD
  SEED_MASTER_NAME
  LOCAL_STORAGE_PATH
  SYSTEM_NAME
  SYSTEM_VERSION
  SYSTEM_DESCRIPTION
)
