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

## 🚀 Configuração inicial

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd core-service
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` se necessário. **Atenção:** se rodado com o docker, o `POSTGRES_HOST` deve ser `postgres` (nome do serviço Docker), não `localhost`, assim como o RABBITMQ_HOST:

### 3. Suba os containers pela primeira vez

```bash
docker compose up --build
```

### 4. Em outro terminal, rode as migrations

```bash
docker compose exec app npm run db:migrate
```

### 5. Em seguida rode o script seed para popular o banco

```bash
docker compose exec app npm run db:seed
```

Pronto! A API estará disponível em `http://localhost:3333`.

---

## 📅 Uso no dia a dia

### Subir o ambiente

```bash
# Sobe em foreground (ver logs direto)
docker compose up

# Sobe em background
docker compose up -d
```

### Parar o ambiente

```bash
docker compose down
```

### Ver logs

```bash
docker compose logs -f app
docker compose logs -f postgres
```

---

## 📦 Scripts disponíveis

Todos os scripts são executados **dentro do container** com `docker compose exec app`:

| Comando | Descrição |
|---|---|
| `docker compose exec app npm run db:generate` | Gera arquivos de migration a partir do schema |
| `docker compose exec app npm run db:migrate` | Executa as migrations pendentes |
| `docker compose exec app npm run build` | Compila o projeto TypeScript |

### Atalho: abrir um shell no container

```bash
docker compose exec app sh
```

---

## 🔄 Quando usar `--build`?

O código roda via **bind mount** — alterações nos arquivos `.ts` são refletidas instantaneamente sem rebuild. O `--build` só é necessário em casos específicos:

| Situação | Comando |
|---|---|
| Alterou código `.ts` | `docker compose up` |
| Instalou/removeu pacote (`package.json`) | `docker compose up --build` |
| Alterou o `Dockerfile.dev` | `docker compose up --build` |
| Mudou a versão do Node | `docker compose up --build` |

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

---

## 📁 Estrutura do projeto

```
core-service/
├── src/               # Código-fonte TypeScript
├── drizzle/           # Arquivos de migration gerados
├── dist/              # Build compilado (gerado, não versionar)
├── Dockerfile.dev     # Imagem de desenvolvimento
├── compose.yml        # Orquestração dos serviços
├── drizzle.config.ts  # Configuração do DrizzleORM
├── tsconfig.json      # Configuração do TypeScript
├── biome.json         # Configuração do linter/formatter
├── .env.example       # Modelo de variáveis de ambiente
└── package.json
```