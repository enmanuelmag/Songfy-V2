import colors from 'tailwindcss/colors';
import { useTheme } from 'tamagui';

import type { ColorTokens } from 'tamagui';

export const useColor = (color: keyof typeof colors, intensity = 500) => {
  // const { theme = 'light' } = useAppStore();

  // intensity = theme === 'light' ? intensity : intensity - 100;

  const colorValue = colors[color];

  if (typeof colorValue === 'object' && intensity.toString() in colorValue) {
    return colorValue[
      intensity.toString() as keyof typeof colorValue
    ] as `#${string}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!colorValue || typeof colorValue !== 'object') {
    console.warn(
      `Color "${color}" not found in tailwind colors. Returning default color.`
    );
    return colors.gray[500] as `#${string}`;
  }

  return colorValue[500] as `#${string}`;
};

export function useTamaguiColor(token: ColorTokens) {
  const theme = useTheme();
  return theme[token]?.val;
}
