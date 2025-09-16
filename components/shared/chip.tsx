import { Text, View, XStack } from 'tamagui';

import React from 'react';

import { Colors } from '@constants/budget';

import type { TamaguiElement } from 'tamagui';

type ChipProps = {
  children: React.ReactNode;
  color: string;
  iconLeft?: any;
  iconRight?: any;
  onPress?: () => void;
};

const Chip = React.forwardRef<TamaguiElement, ChipProps>(
  (props: ChipProps, ref) => {
    const { color, children, iconRight, iconLeft, onPress } = props;
    return (
      <View
        bg={Colors[color as keyof typeof Colors][100] as `#${string}`}
        pl={iconLeft ? '$2' : '$3'}
        pr={iconRight ? '$2' : '$3'}
        py="$1.5"
        ref={ref}
        rounded="$10"
      >
        <XStack
          content="center"
          gap="$2"
          items="center"
          justify="space-between"
        >
          {iconLeft}
          <Text
            color={Colors[color as keyof typeof Colors][900] as `#${string}`}
            fontSize="$textSm"
            fontWeight="600"
            onPress={onPress}
          >
            {children}
          </Text>
          {iconRight}
        </XStack>
      </View>
    );
  }
);

export default Chip;
