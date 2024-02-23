import Decimal from 'decimal.js';

Decimal.set({
  rounding: Decimal.ROUND_DOWN,
  toExpPos: 9e15,
  toExpNeg: -9e15,
  precision: 50,
});
