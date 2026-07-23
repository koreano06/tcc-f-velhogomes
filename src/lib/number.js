function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function toWeight(value) {
  return Number(toNumber(value).toFixed(3));
}

module.exports = { toMoney, toNumber, toWeight };

