# Diagnóstico e Decisões Técnicas

## 1. Backend único

Antes havia dois backends no projeto:

- `src/`
- `backend-final/src/`

Isso criava risco de manutenção porque cada pasta tinha rotas, controllers e modelo de banco diferentes. A decisão tomada foi manter o backend principal em `src/` e incorporar nele as ideias boas do `backend-final`.

Resultado:

- `src/routes.js` passa a ser a fonte oficial das rotas.
- `prisma/schema.prisma` passa a ser a fonte oficial do banco.
- O código antigo baseado em `pg` e tabelas antigas foi removido do backend principal.

## 2. Modelo único de banco

O projeto tinha dois padrões:

- Antigo: `id_material`, `preco_base`, `compra`, `venda`, `item_compra`, `item_venda`.
- Novo: `id`, `preco_compra_kg`, `preco_venda_kg`, `compras`, `vendas`.

O padrão escolhido foi evoluído para Prisma com nomes mais consistentes:

- `users`
- `materials`
- `stocks`
- `purchases`
- `sales`
- `audit_logs`

No frontend, alguns campos antigos ainda são aceitos por compatibilidade, mas a API oficial já responde no padrão novo.

## 3. Prisma ORM

O Prisma foi adotado para deixar a modelagem do banco em um lugar só. Isso reduz erro de digitação em SQL manual e facilita migrations.

Arquivos principais:

- `prisma/schema.prisma`
- `prisma/seed.js`
- `src/lib/prisma.js`

## 4. Segurança

O login deixou de ser validado apenas no frontend. Agora:

- Usuários ficam na tabela `users`.
- PIN/senha fica salvo como hash em `password_hash`.
- Login é feito por `POST /api/auth/login`.
- O backend retorna um JWT.
- Rotas protegidas exigem `Authorization: Bearer <token>`.

Isso impede que alguém apenas altere o frontend para acessar áreas restritas.

## 5. Exclusão segura de material

Material não é mais apagado fisicamente. Agora a exclusão vira desativação:

- Campo: `materials.active`.
- Controller: `desativarMaterial`.

Essa decisão preserva histórico de compras, vendas e auditoria.

## 6. Estoque

O estoque agora é atualizado dentro das transações de compra e venda no backend.

Motivo:

- Fica mais fácil entender o fluxo.
- Evita trigger escondida no banco.
- Permite validar saldo antes de vender.

## 7. Próximas melhorias

- Criar tabela real de clientes e fornecedores.
- Criar contas a pagar/receber reais.
- Adicionar refresh token ou expiração visual da sessão.
- Adicionar testes de API.
- Criar uma tela administrativa para usuários.

