# Ferro Velho Gomes — Backend
 
API REST do sistema de gerenciamento de materiais recicláveis do Ferro Velho Gomes, desenvolvido como trabalho de conclusão de curso (PUC/GO).
 
Este diretório é o **único backend oficial** do projeto. Versões anteriores e experimentais foram incorporadas a este backend para evitar múltiplos servidores e modelos de banco concorrendo entre si.
 
---
 
## 📋 Sobre o projeto
 
Sistema backend para controle e listagem de materiais recicláveis de um ferro-velho. A API fornece os dados para o frontend consumir, conectando-se a um banco de dados PostgreSQL e expondo endpoints via HTTP.
 
---
 
## 🛠️ Tecnologias utilizadas
 
- **Node.js** — ambiente de execução JavaScript
- **Express** — framework web para criação da API REST
- **PostgreSQL** — banco de dados relacional
- **Prisma ORM** — modelagem e acesso ao banco de dados
- **JWT** — autenticação e gerenciamento de sessão
- **bcryptjs** — hash de PIN/senha
- **CORS** — habilitação de requisições cross-origin para o frontend
---
 
## 📁 Estrutura do projeto
 
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
 
---
 
## 🚀 Como rodar localmente
 
### Pré-requisitos
 
- [Node.js](https://nodejs.org/) instalado
- [PostgreSQL](https://www.postgresql.org/) instalado e rodando
### Passo a passo
 
**1. Clone o repositório**
 
```bash
git clone https://github.com/koreano06/tcc-f-velhogomes.git
cd tcc-f-velhogomes
```
 
**2. Instale as dependências**
 
```bash
npm install
```
 
**3. Configure as variáveis de ambiente**
 
Copie o arquivo de exemplo e preencha com os seus próprios dados (nunca versione o `.env` real):
 
```bash
cp .env.example .env
```
 
No `.env`, ajuste pelo menos:
 
- `DATABASE_URL` — string de conexão com o seu banco PostgreSQL local
- `JWT_SECRET` — uma chave secreta própria para assinatura dos tokens
**4. Crie as tabelas com Prisma**
 
```bash
npm run prisma:migrate
```
 
**5. Crie os usuários iniciais**
 
```bash
npm run seed
```
 
**6. Rode a API**
 
```bash
npm run dev
```
 
A API sobe em `http://localhost:3000/api`.
 
---
 
## 👤 Usuários iniciais
 
O seed cria os usuários padrão do sistema (`gomes`, `joao` e `consulta`). Os PINs ficam salvos no banco com hash, nunca em texto puro.
 
---
 
## 🔌 Rotas principais
 
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autenticação de usuário |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| GET | `/api/materiais` | Lista os materiais cadastrados |
| POST | `/api/materiais` | Cadastra um novo material |
| PUT | `/api/materiais/:id` | Atualiza um material existente |
| DELETE | `/api/materiais/:id` | Remove um material |
| GET | `/api/estoque` | Consulta o estoque atual |
| POST | `/api/purchases` | Registra uma compra |
| POST | `/api/sales` | Registra uma venda |
| GET | `/api/reports/financial` | Relatório financeiro |
| GET | `/api/reports/profit-by-material` | Relatório de lucro por material |
| GET | `/api/management/overview` | Visão geral de gestão |
| GET | `/api/management/finance` | Gestão financeira |
| GET | `/api/management/partners` | Gestão de sócios/parceiros |
| GET | `/api/management/audit` | Auditoria de ações no sistema |
 
---
 
## 👨‍💻 Autor
 
Desenvolvido como trabalho de conclusão de curso (TCC) — PUC/GO.