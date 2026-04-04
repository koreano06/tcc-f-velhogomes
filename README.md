# tcc-f-velhogomes — Backend

API REST backend do sistema de gerenciamento de materiais recicláveis desenvolvido como trabalho da faculdade (PUC/GO).

---

## 📋 Sobre o projeto

Sistema backend para controle e listagem de materiais recicláveis de um ferro-velho. A API fornece os dados para o frontend consumir, conectando-se a um banco de dados PostgreSQL e expondo endpoints via HTTP.

---

## 🛠️ Tecnologias utilizadas

- **Node.js** — ambiente de execução JavaScript
- **Express 5** — framework web para criação da API REST
- **PostgreSQL** — banco de dados relacional
- **pg** — driver Node.js para conexão com PostgreSQL
- **CORS** — habilitação de requisições cross-origin para o frontend

---

## 📁 Estrutura do projeto
tcc-f-velhogomes/
├── src/
│   ├── controllers/
│   │   └── materialController.js  # Lógica de negócio dos materiais
│   ├── database/
│   │   └── db.js                  # Configuração da conexão com PostgreSQL
│   ├── routes.js                  # Definição das rotas da API
│   └── server.js                  # Inicialização do servidor
├── package.json
└── .gitignore

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

**3. Configure o banco de dados**

Crie um banco chamado `f_velhogomes` no PostgreSQL e ajuste as credenciais em `src/database/db.js`:
```js
const pool = new Pool({
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'f_velhogomes',
  port: 5432,
});
```

**4. Inicie o servidor**
```bash
node src/server.js
```

O servidor vai rodar em `http://localhost:3000`

---

## 🔌 Endpoints disponíveis

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/` | Verifica se a API está funcionando |
| GET | `/api/materiais` | Lista todos os materiais cadastrados |

---

## 👨‍💻 Autor

**Gustavo Ramos** — [@koreano06](https://github.com/koreano06)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/gustavo-ramos-843543397)
