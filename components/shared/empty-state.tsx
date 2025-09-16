import { Text, YStack } from 'tamagui';

import type { SvgProps } from 'react-native-svg';

type EmptyStateProps = {
  text?: string;
  image?: React.FC<SvgProps> | React.ReactElement;
  children?: React.ReactNode;
};

const EmptyState = ({ children, image, text }: EmptyStateProps) => (
  <YStack
    content="center"
    gap="$2"
    height="100%"
    items="center"
    justify="center"
  >
    {image && (
      <YStack height={250} items="center" justify="center" width="100%">
        {image}
      </YStack>
    )}
    {text && (
      <Text color="$gray11" fontSize="$textLg" text="center">
        {text}
      </Text>
    )}
    {children && children}
  </YStack>
);

export default EmptyState;
