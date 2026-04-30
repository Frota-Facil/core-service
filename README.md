# 🚛 SIF — Core Service

API backend do projeto SIF, construída com **Fastify**, **DrizzleORM** e **PostgreSQL**, padronizada via **Docker** para garantir o mesmo ambiente em toda a equipe.

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22.14.0 |
| Framework | Fastify 5 |
| ORM | Drizzle ORM |
| Banco de dados | PostgreSQL 16 |
| Linguagem | TypeScript 6 |
| Validação | Zod |
| Linter/Formatter | Biome |
| Ambiente | Docker + Docker Compose |

---

## ⚙️ Pré-requisitos

Instale apenas esses dois:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) *(já incluso no Docker Desktop)*

> Não é necessário instalar Node.js localmente.

---

## 🚀 Rodando em desenvolvimento (Docker Compose + script `.sh`)

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd core-service
```

### 2. Configure as variáveis de ambiente de dev

```bash
cp .env.example .env.dev
```

Edite o `.env.dev` se necessario.

### 3. Suba os containers pela primeira vez

```bash
docker compose -f compose.dev.yml up --build -d
```

### 4. Rode migrate + generate + seed no `app-dev`

```bash
# Linux / macOS / Git Bash / WSL
bash ./scripts/docker-db-setup-dev.sh
```

Ou, via npm script:

```bash
npm run db:setup:dev
```

Pronto! A API estará disponível em `http://localhost:3333`.

---

## 📅 Uso no dia a dia

### Subir o ambiente

```bash
# Sobe em foreground (ver logs direto)
docker compose -f compose.dev.yml up

# Sobe em background
docker compose -f compose.dev.yml up -d
```

### Parar o ambiente

```bash
docker compose -f compose.dev.yml down
```

### Ver logs

```bash
docker compose -f compose.dev.yml logs -f app-dev
docker compose -f compose.dev.yml logs -f postgres-dev
```

---

## 📦 Scripts disponíveis

Todos os scripts abaixo sao executados **dentro do container** `app-dev`:

| Comando | Descrição |
|---|---|
| `docker compose -f compose.dev.yml exec app-dev npm run db:generate` | Gera arquivos de migration a partir do schema |
| `docker compose -f compose.dev.yml exec app-dev npm run db:migrate` | Executa as migrations pendentes |
| `docker compose -f compose.dev.yml exec app-dev npm run db:seed` | Popula o banco com dados iniciais |
| `bash ./scripts/docker-db-setup-dev.sh` | Roda `db:migrate`, `db:generate` e `db:seed` em sequencia |

### Atalho: abrir um shell no container

```bash
docker compose -f compose.dev.yml exec app-dev sh
```

---

## 🔄 Quando usar `--build`?

O código roda via **bind mount** — alterações nos arquivos `.ts` são refletidas instantaneamente sem rebuild. O `--build` só é necessário em casos específicos:

| Situação | Comando |
|---|---|
| Alterou codigo `.ts` | `docker compose -f compose.dev.yml up` |
| Instalou/removeu pacote (`package.json`) | `docker compose -f compose.dev.yml up --build` |
| Alterou o `Dockerfile.dev` | `docker compose -f compose.dev.yml up --build` |

---

## 🗄️ Banco de dados

O PostgreSQL roda em container com dados persistidos no volume `postgres_data`. Para conectar via cliente externo (DBeaver, pgAdmin, etc.):

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5432` |
| Usuário | valor de `POSTGRES_USER` no `.env` |
| Senha | valor de `POSTGRES_PASSWORD` no `.env` |
| Database | valor de `POSTGRES_DB` no `.env` |

> ⚠️ Para apagar todos os dados do banco: `docker compose down -v` (remove o volume).
> ⚠️ Para apagar todos os dados do banco no ambiente dev: `docker compose -f compose.dev.yml down -v` (remove os volumes).

---

## 🔍 Linting e formatação

O projeto usa **Biome** como linter e formatter. As regras estão definidas em `biome.json` (indentação com tabs, aspas duplas, organização automática de imports).

### Rodar manualmente

```bash
# Checa e corrige todos os arquivos
docker compose exec app npx biome check --write .

# Só checa sem corrigir
docker compose exec app npx biome check .
```

---

## 🧹 Manutenção do Docker

Rode periodicamente para evitar acúmulo de imagens antigas:

```bash
# Remove imagens sem uso
docker image prune

# Limpeza geral (imagens, containers parados, cache de build)
docker system prune
```