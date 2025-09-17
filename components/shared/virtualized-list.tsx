import { AnimatePresence, View } from 'tamagui';

import React from 'react';

import {
  VirtualizedList as NativeVirtualizedList,
  StyleSheet,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '@store/index';
import { getScrollGradient } from '@utils/platform';

import LoaderText from './loader-text';

type VirtualizedListProps = {
  items: Array<any>;
  bottomGradientClass?: string;
  initialNumToRender?: number;
  loading?: boolean;
  loadingText?: string;
  renderItem: (props: { item: any; index: number }) => React.ReactElement;
};

type GradientType = {
  top: boolean;
  bottom: boolean;
};

const VirtualizedList = (props: VirtualizedListProps) => {
  const {
    items,
    initialNumToRender = 3,
    renderItem,
    loading,
    loadingText,
  } = props;

  const { theme } = useAppStore();

  const [gradientType, setGradientType] = React.useState<GradientType>({
    top: false,
    bottom: false,
  });

  if (loading) {
    return (
      <View flex={1} items="center" justify="center">
        <LoaderText text={loadingText || 'Loading'} />
      </View>
    );
  }

  return (
    <React.Fragment>
      <View position="relative">
        <NativeVirtualizedList
          data={items}
          getItem={(data, index) => data[index]}
          getItemCount={(data) => data.length}
          initialNumToRender={initialNumToRender}
          keyExtractor={(_, idx) => `schedule-${idx}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          style={{
            width: '100%',
          }}
          onScroll={(e) =>
            setGradientType(getScrollGradient(e.nativeEvent.contentOffset.y))
          }
        />

        <AnimatePresence>
          {gradientType.top && (
            <LinearGradient
              colors={getColor(theme === 'light' ? 255 : 0, 'top') as any}
              style={StyleGradient.top}
            />
          )}
        </AnimatePresence>
      </View>
      <AnimatePresence>
        {gradientType.bottom && (
          <LinearGradient
            colors={getColor(theme === 'light' ? 255 : 0, 'bottom') as any}
            style={StyleGradient.bottom}
          />
        )}
      </AnimatePresence>
    </React.Fragment>
  );

  function getColor(value: number, dir: 'top' | 'bottom') {
    if (dir === 'top') {
      return [
        `rgba(${value}, ${value}, ${value}, ${value}.85)`,
        `rgba(${value}, ${value}, ${value}, 0)`,
      ];
    } else {
      return [
        `rgba(${value}, ${value}, ${value}, 0)`,
        `rgba(${value}, ${value}, ${value}, ${value}.85)`,
      ];
    }
  }
};

const StyleGradient = StyleSheet.create({
  top: {
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
    height: 35,
  },
  bottom: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
  },
});

export default VirtualizedList;
