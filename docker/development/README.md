# Deploy — Vizioon Brew (homolog / development)

```bash
cd docker
bash development/deploy.sh
```

A imagem continua com `NODE_ENV=production`, porque o que sobe é o servidor já compilado. `APP_ENV` só marca o ambiente do deploy.
