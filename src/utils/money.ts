import { HttpStatus } from './api-response.js';
import { createHttpError } from './http-error.js';

export type DecimalAmount = {
  toFixed: (decimalPlaces: number) => string;
};

export const toMinorUnits = (amount: DecimalAmount) => {
  const minorUnits = Number(amount.toFixed(2).replace('.', ''));

  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    throw createHttpError(HttpStatus.BAD_REQUEST, 'Amount cannot be converted to minor units.', 'INVALID_MONEY_AMOUNT');
  }

  return minorUnits;
};
