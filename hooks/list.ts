import React from 'react';

export type ListActions<T> = {
  add: (item: T) => void;
  remove: (index: number) => void;
  clear: () => void;
};

export const useListState = <T>(initialList: Array<T>) => {
  const [list, setList] = React.useState(initialList);

  const add = (item: T) => {
    setList([...list, item]);
  };

  const remove = (index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const clear = () => {
    setList([]);
  };

  return [list, { add, remove, clear }] as const;
};
