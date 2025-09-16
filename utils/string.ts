import { formatNumber } from 'react-native-currency-input';

import { useAppStore } from '@store/index';

export const capitalize = (s: string, onlyFirst = false) => {
  if (onlyFirst) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return s
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type FormatNumberOptions = {
  symbol?: string;
  precision?: number;
};

export function formatCurrency(amount: number, options?: FormatNumberOptions) {
  const { symbol: symbolStore } = useAppStore.getState().currency;

  const { symbol = symbolStore, precision = 2 } = options || {};

  if (isNaN(amount)) {
    return '';
  }

  return formatNumber(amount, { prefix: symbol, precision });
}

export function formatCurrencyLabel(amount: number) {
  if (amount < 1e3) {
    return formatCurrency(amount, {
      precision: 0,
    });
  } else if (amount < 1e6) {
    return (
      formatCurrency(amount / 1e3, {
        precision: 0,
      }) + 'K'
    );
  } else if (amount < 1e9) {
    return (
      formatCurrency(amount / 1e6, {
        precision: 0,
      }) + 'M'
    );
  } else if (amount < 1e12) {
    return (
      formatCurrency(amount / 1e9, {
        precision: 0,
      }) + 'B'
    );
  } else {
    return (
      formatCurrency(amount / 1e12, {
        precision: 0,
      }) + 'T'
    );
  }
}

export const cleanNumber = (value: string) => {
  return value.replace(/[^0-9.]/g, '');
};
