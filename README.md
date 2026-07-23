# Ferro Velho Gomes — Backend Oficial

API REST do sistema de gerenciamento do Ferro Velho Gomes.

Este diretório agora é o **único backend oficial** do projeto. A pasta `backend-final` foi incorporada ao backend principal para evitar dois servidores e dois modelos de banco concorrendo.

## Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT para sessão
- bcryptjs para hash de PIN/senha

## Estrutura

```txt
src/
  controllers/     Regras HTTP de cada módulo
  lib/             Prisma, conversões e mapeadores
  middlewares/     Autenticação, autorização e erros
  app.js           Configuração do Express
  routes.js        Rotas oficiais da API
  server.js        Entrada do servidor
prisma/
  schema.prisma    Modelo oficial do banco
  seed.js          Usuários iniciais
```

## Configuração

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL` e `JWT_SECRET`.
3. Instale dependências:

```bash
npm install
```

4. Crie as tabelas com Prisma:

```bash
npm run prisma:migrate
```

5. Crie os usuários iniciais:

```bash
npm run seed
```

6. Rode a API:

```bash
npm run dev
```

A API sobe em `http://localhost:3000/api`.

## Usuários Iniciais

O seed cria os usuários `gomes`, `joao` e `consulta`. Os PINs ficam salvos no banco com hash, não em texto puro.

## Rotas Principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/materiais`
- `POST /api/materiais`
- `PUT /api/materiais/:id`
- `DELETE /api/materiais/:id`
- `GET /api/estoque`
- `POST /api/purchases`
- `POST /api/sales`
- `GET /api/reports/financial`
- `GET /api/reports/profit-by-material`
- `GET /api/management/overview`
- `GET /api/management/finance`
- `GET /api/management/partners`
- `GET /api/management/audit`

