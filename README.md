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
**4. Prepare o banco com Prisma**
 
```bash
npm run banco:migrar
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

O modelo oficial, as migrations e o procedimento seguro de adoção de um banco existente estão em [docs/banco-de-dados.md](docs/banco-de-dados.md).
 
---
 
## 👤 Usuários iniciais
 
O seed cria os usuários padrão do sistema (`gomes`, `joao` e `consulta`). Os PINs ficam salvos no banco com hash, nunca em texto puro.
 
---
 
## 🔌 Rotas principais
 
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/saude` | Verificação de disponibilidade da API |
| POST | `/api/autenticacao/entrar` | Autenticação de usuário |
| GET | `/api/autenticacao/perfil` | Dados do usuário autenticado |
| GET | `/api/materiais` | Lista os materiais cadastrados |
| POST | `/api/materiais` | Cadastra um novo material |
| PUT | `/api/materiais/:id` | Atualiza um material existente |
| DELETE | `/api/materiais/:id` | Remove um material |
| POST | `/api/compras` | Registra uma compra |
| POST | `/api/vendas` | Registra uma venda |
| GET | `/api/relatorios/financeiro` | Relatório financeiro |
| GET | `/api/relatorios/lucro-por-material` | Relatório de lucro por material |
| GET | `/api/gestao/resumo` | Visão geral de gestão |
| GET | `/api/gestao/financeiro` | Gestão financeira |
| GET | `/api/gestao/parceiros` | Gestão de sócios/parceiros |
| GET | `/api/gestao/auditoria` | Auditoria de ações no sistema |
 
---
 
## 👨‍💻 Autor
 
Desenvolvido como trabalho de conclusão de curso (TCC) — PUC/GO.
