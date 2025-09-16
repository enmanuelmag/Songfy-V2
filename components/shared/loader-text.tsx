import { Spinner, Text, View } from 'tamagui';

import { useAppStore } from '@store/index';

type LoaderProps = {
  color?: string;
  size?: 'small' | 'large';
  text?: string;
};

const LoaderText = ({ size, text }: LoaderProps) => {
  const { theme } = useAppStore();

  return (
    <View>
      <Spinner
        color={theme === 'light' ? '$blue11' : '$blue11Dark'}
        size={size ?? 'small'}
      />
      <Text color="$gray11" fontSize="$6" text="center">
        {text}
      </Text>
    </View>
  );
};

export default LoaderText;
