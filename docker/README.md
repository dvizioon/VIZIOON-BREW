# Docker

A imagem segue o mesmo desenho do Nexus: `ARG APP_PORT` e `ARG APP_ENV` no Dockerfile, Compose em `production` e `development`, e o `docker/.env` gerado na hora do deploy.

O arquivo `.env` da máquina não entra na imagem. O script copia as chaves para `docker/.env`, inclusive `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS`. O entrypoint monta a URL do Postgres com esses valores. Os arquivos enviados ficam em `/app/storage`.

No Coolify as mesmas chaves são gravadas em Environment Variables. Não envie o `.env`.

```bash
cd docker
bash production/deploy.sh
```

Homologação: `bash development/deploy.sh`.
