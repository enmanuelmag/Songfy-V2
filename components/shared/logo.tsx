import { Text } from 'tamagui';

import type { FontSizeTokens } from 'tamagui';

type LogoProps = {
  normal: string;
  colored: string;
  size?: FontSizeTokens;
};

const Logo = (props: LogoProps) => {
  const { normal, colored, size } = props;

  return (
    <Text fontSize={size || '$textXl'} fontWeight="bold">
      {normal}
      <Text color="$primary" fontSize={size || '$textXl'} fontWeight="bold">
        {colored}
      </Text>
    </Text>
  );
};

export default Logo;
