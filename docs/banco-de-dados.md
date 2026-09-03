# Banco de dados

O PostgreSQL do sistema é definido exclusivamente por `prisma/schema.prisma` e por `prisma/migrations/`. Não execute arquivos SQL avulsos para criar, alterar ou popular tabelas.

## Estrutura

- Schema PostgreSQL: `ferro_velho`.
- ORM e migrations: Prisma.
- Datas, auditoria e movimentações: armazenadas com fuso horário.
- Estoque: atualizado pela transação da aplicação; não use gatilhos de estoque.
- Auditoria: gravada pela aplicação nas operações de materiais, compras e vendas.

## Ambiente novo

1. Configure `DATABASE_URL` com `schema=ferro_velho`.
2. Execute `npm run banco:implantar`.
3. Execute `npm run seed`.

## Banco existente

Faça backup antes de qualquer mudança. Em ambiente de desenvolvimento, a forma segura de adotar a estrutura inicial é criar um banco vazio e aplicar as migrations. Em produção, a adoção exige uma migration de transição revisada sobre uma cópia restaurada do banco; não use `migrate reset`.

## Operação

- Use uma conta exclusiva da aplicação, sem privilégios de superusuário.
- Faça backup diário e teste restaurações periodicamente.
- Monitore conexões e consultas lentas.
- Execute `npm run banco:validar` no fluxo de integração contínua.
