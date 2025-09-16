import { createTamagui } from 'tamagui';

import { createAnimations } from '@tamagui/animations-react-native';
import { defaultConfig } from '@tamagui/config/v4';
import { createInterFont } from '@tamagui/font-inter';
import { tokens } from '@tamagui/themes';

import { themes } from './theme-custom';

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

const config = createTamagui({
  ...defaultConfig,
  themes,
  animations,
  fonts: {
    heading: headingFont,
    body: {
      ...bodyFont,
      size: {
        ...bodyFont.size,
        textXxs: 10,
        textXs: 12,
        textSm: 13,
        textMd: 15,
        textLg: 18,
        textXl: 20,
        text2Xl: 22,
        text3Xl: 24,
        text4Xl: 26,
      },
    },
  },
  tokens,
  // media: createMedia({
  //   xs: { maxWidth: 660 },
  //   sm: { maxWidth: 800 },
  //   md: { maxWidth: 1020 },
  //   lg: { maxWidth: 1280 },
  //   xl: { maxWidth: 1420 },
  //   xxl: { maxWidth: 1600 },
  //   gtXs: { minWidth: 660 + 1 },
  //   gtSm: { minWidth: 800 + 1 },
  //   gtMd: { minWidth: 1020 + 1 },
  //   gtLg: { minWidth: 1280 + 1 },
  //   short: { maxHeight: 820 },
  //   tall: { minHeight: 820 },
  //   hoverNone: { hover: 'none' },
  //   pointerCoarse: { pointer: 'coarse' },
  // }),
});

export type Conf = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line no-unused-vars
  interface TamaguiCustomConfig extends Conf {}
}

// declare module 'tamagui' {
//   // overrides TamaguiCustomConfig so your custom types
//   // work everywhere you import `tamagui`
//   interface TamaguiCustomConfig extends AppConfig {}
// }

// declare module '@tamagui/core' {
//   interface TamaguiCustomConfig extends AppConfig {}
// }

export default config;
