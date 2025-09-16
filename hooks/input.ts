import React from 'react';

export const useDebounce = <T = string>(
  value: T,
  milliSeconds: number,
  onDebounce?: () => void,
) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      onDebounce?.();
    }, milliSeconds);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, milliSeconds]);

  return debouncedValue;
};

export const useDebounceState = <T = string>(initialValue: T, milliSeconds: number) => {
  const [debouching, setDebouncing] = React.useState(false);

  const [value, setValue] = React.useState(initialValue);
  const debouncedValue = useDebounce(value, milliSeconds, () => setDebouncing(false));

  React.useEffect(() => {
    setDebouncing(true);
  }, [value]);

  return [value, debouncedValue, setValue, debouching] as const;
};
