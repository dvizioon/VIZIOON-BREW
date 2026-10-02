<div align="center">
  <img src="public/assets/logo.svg" alt="Logo do Vizioon Brew" width="180" />
</div>

<br />

<h1 align="center">Vizioon Brew</h1>

<p align="center">
  Plataforma interna de estudos de Java.<br />
  O tech lead publica blends, doses, atividades e a receita da semana.<br />
  O estagiário estuda, entrega o Lab e acompanha o próprio progresso.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <br />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/VERSION-1.0.0-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/IDIOMA-pt--BR-F0A36A?style=for-the-badge" />
</p>

<p align="center">
  <a href="VIZIOON-BREW/Bem-vindo.md">Documentação</a> ·
  <a href="https://vizioon.com">vizioon.com</a> ·
  <a href="mailto:contato@vizioon.com">Contato</a>
</p>

---

## O que é

O Vizioon Brew é uma plataforma fechada para o time de estagiários. A interface fala a língua do projeto. O código e o banco usam os nomes técnicos.

| Na tela | No código e no banco | Significado |
| --- | --- | --- |
| Blend | `Track` | Trilha de estudo |
| Módulo | `Module` | Grupo de doses dentro de um blend |
| Dose | `Lesson` | Unidade: vídeo, leitura, prática ou consulta |
| Receita da semana | `StudyPlan` | Plano com doses e prazos |
| Desafio | `Challenge` | Especificação no Lab. Entrega em zip, nota de 0 a 100 |
| Tech lead | papel `ADMIN` | Publica conteúdo e vê a turma |
| Estagiário | papel `ESTAGIARIO` | Estuda e vê só o próprio progresso |

Quem entra recebe e-mail e senha criados pelo tech lead. A sessão é JWT, válida por 14 dias.

A documentação de produto e de código fica no cofre Obsidian `VIZIOON-BREW/`, começando por [Bem-vindo](VIZIOON-BREW/Bem-vindo.md).

---

## Como funciona

```text
Tech lead                         Estagiário
   |                                  |
   | publica blend, módulo, dose      |
   | lança atividade e desafio        |
   | monta a receita da semana        |
   v                                  v
Conteúdo publicado              Estuda a dose
                                Responde a questão
                                Executa a atividade
                                Envia o zip do Lab
                                       |
                                       v
                              Attempt, LessonProgress,
                              LabSubmission, ActivityLog
                                       |
                                       v
                         Relatório da turma e Meu desempenho
```

1. O tech lead monta o blend em `/admin/conteudo`: módulos, doses, materiais e questões.
2. No módulo, a atividade pede código. O estagiário escreve, roda os testes e entrega. A entrega só conclui se as questões passarem. A classe Java corrigida se chama `Main`. A saída esperada dos testes não vai para o navegador.
3. No Lab (`/lab`) o tech lead escreve a especificação em Markdown e lança o desafio. O estagiário envia um zip. O tech lead baixa, dá a nota de 0 a 100 e pode comentar.
4. A receita da semana define doses e prazos, para todos ou para uma lista de pessoas.
5. Relatórios e o painel leem o progresso. A nota do Lab fica em `LabSubmission` e não entra na média das doses.

Uma dose de questão fecha a partir de 70%. Cada envio vira um `Attempt`. Dá para tentar de novo.

### Papéis

| Papel | Entra em | Fica de fora |
| --- | --- | --- |
| Tech lead | Painel, estagiários, conteúdo, Lab, receitas, relatórios. Pré-visualiza rascunho e vê o gabarito. | `/dashboard`, `/meu-plano`, `/meu-desempenho` |
| Estagiário | Blends publicados, doses, Lab lançado, receita e o próprio desempenho. | `/admin` e a exportação CSV |

A raiz `/` manda cada sessão para o lugar certo: sem login vai para `/login`, senha inicial ainda não trocada vai para `/trocar-senha`, tech lead vai para `/admin` e estagiário vai para `/dashboard`.

---

## Peças

- **Blend, módulo e dose.** Rascunho some para o estagiário. A ordem de módulos e doses muda arrastando o ícone.
- **Dose.** Vídeo (YouTube, Vimeo, outro link ou arquivo `.mp4`/`.webm` até 50 MB), leitura em Markdown, prática ou consulta.
- **Materiais.** PDF, slides, zip, imagens e documentos. O arquivo fica fora da pasta pública e só sai por rota autenticada.
- **Questão de múltipla escolha.** De duas a quatro alternativas. A correção acontece no servidor.
- **Prática.** O estagiário envia arquivo, link, ou os dois. O tech lead dá a nota de 0 a 100.
- **Atividade de código.** Java 15.0.2 e Python 3.12.0, isolados com `bwrap` no mesmo processo da aplicação.
- **Lab.** Especificação, zip e nota manual. A plataforma não roda o zip.
- **Receita da semana.** Itens concluídos, atrasados ou próximos. A aderência entra em Meu desempenho.
- **Relatórios.** Progresso, ranking, erros, gráficos e CSV (separador `;`, decimal com vírgula, BOM para o Excel).
- **Contas.** Criar, editar, redefinir senha e excluir estagiário. Senha inicial obriga a troca no primeiro acesso.

## Stack

- Next.js 15, App Router, TypeScript, React 19
- Tailwind CSS 4, Radix Tooltip, Lucide, animate.css
- Prisma 6 com PostgreSQL. A conexão vem de `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS`.
- Auth.js (login por e-mail e senha, bcrypt)
- Zod nas mutações
- Recharts nos gráficos
- Interface em português do Brasil

Os papéis são texto (`ADMIN` e `ESTAGIARIO`).

---

## Estrutura

```text
VIZIOON-BREW/
├── prisma/
│   ├── schema.prisma          modelos
│   ├── seed.ts                dados de exemplo
│   └── migrations             inclusive a retirada da prova
├── public/assets/             logo e fundo
├── src/
│   ├── middleware.ts          sessão e separação admin/estagiário
│   ├── actions/               mutações (auth, conteúdo, estudo, atividade, Lab)
│   ├── app/
│   │   ├── login/             entrada
│   │   ├── trocar-senha/      troca obrigatória ou voluntária
│   │   ├── (app)/             telas autenticadas (o grupo não aparece na URL)
│   │   └── api/               auth, materiais, vídeos, práticas, Lab, CSV
│   ├── components/            formulários, gráficos e kit de UI
│   ├── layout/                menu, marca, tema
│   ├── hooks/
│   ├── lib/                   guards, relatórios, arquivos, executor
│   └── modules/
│       ├── runtimes/          Java 15.0.2 e Python 3.12.0 da atividade
│       └── piston/            clone de referência. A aplicação não sobe esse serviço
├── VIZIOON-BREW/              cofre Obsidian (esta documentação)
├── docker/
│   ├── Dockerfile             imagem, ARG APP_PORT
│   ├── docker-entrypoint.sh
│   ├── README.md
│   ├── production/            compose e deploy de produção
│   └── development/           compose e deploy de homologação
└── docker-compose.yml
```

| URL | Quem |
| --- | --- |
| `/login` | Público |
| `/trocar-senha` | Sessão, obrigatória na senha inicial |
| `/dashboard` | Estagiário |
| `/trilhas` e `/aulas/[id]` | Os dois. Rascunho e gabarito só para o tech lead |
| `/lab` e `/lab/[id]` | Os dois. Rascunho só para o tech lead |
| `/meu-plano` e `/meu-desempenho` | Estagiário |
| `/admin` | Tech lead: painel, estagiários, conteúdo, receitas, relatórios |

O mapa completo está em [12-Mapa-de-Pastas](VIZIOON-BREW/12-Mapa-de-Pastas.md).

---

## Como rodar

Na pasta da aplicação:

```bash
cp .env.example .env
```

Gere um valor longo para `AUTH_SECRET` e salve no `.env`.

```bash
npm install
npx prisma migrate dev
npm run db:seed:demo
npm run dev
```

Abra `http://localhost:3000`.

| Variável | Função |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Conexão PostgreSQL. O Prisma monta a URL a partir desses valores. |
| `AUTH_SECRET` | Assina a sessão. |
| `AUTH_URL` | Endereço da aplicação. Em desenvolvimento, `http://localhost:3000`. |
| `AUTH_TRUST_HOST` | Aceita o host do pedido. |
| `LOCAL_STORAGE_PATH` | PDFs, slides, zips e vídeos. O padrão é `./storage`. |

| Comando | Efeito |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento. |
| `npm run build` / `npm run start` | Gera e serve a versão de produção. |
| `npm run lint` | ESLint. |
| `npm run db:migrate` | Cria e aplica migrações. |
| `npm run db:seed` | Cria o usuário inicial se o e-mail ainda não existe. Não apaga o banco. |
| `npm run db:seed:demo` | Recria usuários, conteúdo e progresso de exemplo. Apaga o que já existe. |
| `npm run db:reset` | Apaga o banco, reaplica as migrações e roda o seed. |
| `npm run runtime:java` | Monta o OpenJDK 15.0.2 em `src/modules/runtimes`, se `bin/java` ainda não existe. |
| `npm run runtime:python` | Monta o Python 3.12.0, se o binário ainda não existe. |

A atividade precisa de `bwrap`, `prlimit` e `timeout` na máquina. Sem o isolamento, ou sem o pacote montado, a atividade abre e o botão de executar avisa. O clone em `src/modules/piston` fica no disco como referência. A aplicação não usa a porta 2000.

### Docker

O desenho é o mesmo do Nexus: Dockerfile em `docker/Dockerfile`, com `APP_PORT` e `APP_ENV`, e o Compose em `docker/production` e `docker/development`.

```bash
cd docker
bash production/deploy.sh
```

A porta publicada é a variável `PORT` (padrão 3630). O script monta `docker/.env` a partir do `.env` da aplicação. O banco é o PostgreSQL de `DB_HOST`. Os arquivos enviados ficam no volume `brew_storage`, em `/app/storage`. O `.dockerignore` deixa o clone `src/modules/piston` de fora. O build monta Java e Python. O serviço usa `privileged` para o `bwrap` isolar o código.

No Coolify o pacote é **Dockerfile**, o caminho é `docker/Dockerfile`, e o build arg `APP_PORT` é a mesma porta do campo Port. As variáveis ficam no painel do container. O `.env` não sobe.

O primeiro banco está vazio. O seed apaga o que já existe, então rode só quando quiser as contas de exemplo:

```bash
docker compose exec app node --experimental-strip-types prisma/seed.ts
```

O passo a passo detalhado está em [01-Como-Rodar](VIZIOON-BREW/01-Como-Rodar.md).

### Contas do seed

| Nome | E-mail | Senha | Papel |
| --- | --- | --- | --- |
| Ana Ribeiro | ana.ribeiro@vizioon.dev | Admin@123 | Tech lead |
| Lucas Ferreira | lucas.ferreira@vizioon.dev | Estagio@123 | Estagiário |
| Marina Costa | marina.costa@vizioon.dev | Estagio@123 | Estagiário |
| Pedro Almeida | pedro.almeida@vizioon.dev | Estagio@123 | Estagiário |

Essas contas entram direto. Um estagiário criado no painel, ou com senha redefinida, precisa trocar a senha no primeiro acesso. O blend de exemplo é "Java Fundamentos". O Lab começa vazio. Entrar com a conta do Pedro atualiza o último acesso, e ele deixa de aparecer como parado. O roteiro está em [11-Seed-e-Contas](VIZIOON-BREW/11-Seed-e-Contas.md).

---

## Onde está cada assunto

| Nota | Conteúdo |
| --- | --- |
| [00-Visao-Geral](VIZIOON-BREW/00-Visao-Geral.md) | Produto e stack |
| [02-Vocabulario](VIZIOON-BREW/02-Vocabulario.md) | Nomes da tela e do banco |
| [03-Perfis-e-Acesso](VIZIOON-BREW/03-Perfis-e-Acesso.md) | Papéis, login e APIs |
| [04-Telas-do-Estagiario](VIZIOON-BREW/04-Telas-do-Estagiario.md) | Telas de quem estuda |
| [05-Telas-do-Tech-Lead](VIZIOON-BREW/05-Telas-do-Tech-Lead.md) | Telas de quem publica |
| [06-Conteudo](VIZIOON-BREW/06-Conteudo.md) | Blend, dose, questão, Lab e atividade |
| [07-Receita-da-Semana](VIZIOON-BREW/07-Receita-da-Semana.md) | Plano e aderência |
| [08-Progresso-e-Relatorios](VIZIOON-BREW/08-Progresso-e-Relatorios.md) | Notas, ranking e CSV |
| [09-Modelo-de-Dados](VIZIOON-BREW/09-Modelo-de-Dados.md) | Tabelas |
| [10-Arquitetura](VIZIOON-BREW/10-Arquitetura.md) | Pedido, actions e leitura |
| [Codigo-00-Indice](VIZIOON-BREW/Codigo-00-Indice.md) | Função por função |

## Arquivos e privacidade

PDF, slides, zip, vídeo e entregas ficam em `LOCAL_STORAGE_PATH`, fora de `public/`. Download e reprodução passam por rotas com sessão. O CSV de relatório responde só para o tech lead.

O plugin de privacidade do Moodle não se aplica aqui. O Brew guarda os dados da própria plataforma: contas, progresso, tentativas, logs e arquivos enviados.

## Contato

Suporte: [contato@vizioon.com](mailto:contato@vizioon.com) · [vizioon.com](https://vizioon.com)

Uso interno. Vizioon Brew 2026. Todos os direitos reservados.
