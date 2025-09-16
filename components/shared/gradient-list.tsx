import { AnimatePresence, View } from 'tamagui';

import React from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '@store/index';
import { getScrollGradient } from '@utils/platform';

type VirtualizedListProps = {
  color?: number;
  fromPopOver?: boolean;
  children: Array<React.ReactElement> | React.ReactElement;
};

type GradientType = {
  top: boolean;
  bottom: boolean;
};

const GradientList = React.forwardRef<any, VirtualizedListProps>(
  (props: VirtualizedListProps, ref) => {
    const { children, fromPopOver, color = 255 } = props;

    const { theme } = useAppStore();

    const [gradientType, setGradientType] = React.useState<GradientType>({
      top: false,
      bottom: false,
    });

    return (
      <React.Fragment>
        <View height="100%" style={{ position: 'relative' }}>
          <ScrollView
            ref={ref}
            showsVerticalScrollIndicator={false}
            onScroll={(e) =>
              setGradientType(getScrollGradient(e.nativeEvent.contentOffset.y))
            }
          >
            {children}
          </ScrollView>

          <AnimatePresence>
            {gradientType.top && (
              <LinearGradient
                colors={
                  getColor(
                    theme === 'light' ? color : fromPopOver ? 23 : 0,
                    'top'
                  ) as any
                }
                style={StyleGradient.top}
              />
            )}
          </AnimatePresence>
        </View>
        <AnimatePresence>
          {gradientType.bottom && (
            <LinearGradient
              colors={
                getColor(
                  theme === 'light' ? color : fromPopOver ? 23 : 0,
                  'bottom'
                ) as any
              }
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
  }
);

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

export default GradientList;
