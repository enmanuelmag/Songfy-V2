import { YStack } from 'tamagui';

import React from 'react';

import type { SpaceTokens } from 'tamagui';

type FloatingButtonsProps = {
  tabBottom?: SpaceTokens;
  children: React.ReactNode;
};

const FloatingButtons = ({ children, tabBottom }: FloatingButtonsProps) => {
  return (
    <YStack b={tabBottom || '$4'} gap="$2.5" position="absolute" r="$3">
      {children}
    </YStack>
  );
};

export default FloatingButtons;
