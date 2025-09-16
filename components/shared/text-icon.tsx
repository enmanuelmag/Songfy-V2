import { XStack } from 'tamagui';

import React from 'react';

import type { SizeTokens } from 'tamagui';

type TextIconProps = {
  text: React.ReactNode;
  icon: any;
  iconRight?: any;
  gap?: SizeTokens;
};

const TextIcon = (props: TextIconProps) => {
  const { text, icon, iconRight, gap } = props;
  return (
    <XStack
      content="center"
      gap={gap || '$1'}
      items="center"
      justify="flex-start"
    >
      {icon}
      {text}
      {iconRight}
    </XStack>
  );
};

export default TextIcon;
