import { findNodeHandle } from 'react-native';

import { Logger } from './log';

import type { ScrollView } from 'react-native';

export const scrollToTarget = (
  inputRef?: React.RefObject<any>,
  refScroll?: React.RefObject<ScrollView | null>
) => {
  if (!inputRef || !refScroll?.current) {
    return;
  }

  const targetViewNodeHandle = findNodeHandle(inputRef.current);

  if (!targetViewNodeHandle) return;

  inputRef.current.measureLayout(
    refScroll.current.getInnerViewNode(),
    (_: number, y: number) => {
      if (!refScroll.current) {
        Logger.warn(
          'ScrollView reference is null or undefined. Cannot scroll to target.'
        );
        return;
      }

      refScroll.current.scrollTo({
        y: y - 25,
        animated: true,
      });
    },
    () => null
  );
};
