const test = require("node:test");
const assert = require("node:assert/strict");
const { toMoney, toNumber, toWeight } = require("../src/lib/number");

test("converte valores inválidos para zero", () => {
  assert.equal(toNumber("invalido"), 0);
  assert.equal(toNumber(undefined), 0);
});

test("normaliza valores monetários e pesos", () => {
  assert.equal(toMoney(12.345), 12.35);
  assert.equal(toWeight(12.3456), 12.346);
});
