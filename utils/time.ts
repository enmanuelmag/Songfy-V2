import type { RepeatType } from '@customTypes/budget';

type RepeatParams = {
  isAlways?: boolean | null;
  times: number;
  type: RepeatType;
};

export function getPeriod(repeat: RepeatParams) {
  const { isAlways, times, type: rType } = repeat;

  if (rType === 'unique') {
    return 'Unique';
  } else {
    if (isAlways) {
      return `Every ${rType}`;
    } else {
      return `Every ${rType} (${times} times)`;
    }
  }
}
