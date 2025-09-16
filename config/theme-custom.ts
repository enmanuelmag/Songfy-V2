import * as Colors from '@tamagui/colors';
import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder';

const darkPalette = [
  Colors.grayDark.gray1,
  Colors.grayDark.gray2,
  Colors.grayDark.gray3,
  Colors.grayDark.gray4,
  Colors.grayDark.gray5,
  Colors.grayDark.gray6,
  Colors.grayDark.gray7,
  Colors.grayDark.gray8,
  Colors.grayDark.gray9,
  Colors.grayDark.gray10,
  Colors.grayDark.gray11,
  Colors.grayDark.gray12,
  // Colors.slateDark.slate1,
  // Colors.slateDark.slate2,
  // Colors.slateDark.slate3,
  // Colors.slateDark.slate4,
  // Colors.slateDark.slate5,
  // Colors.slateDark.slate6,
  // Colors.slateDark.slate7,
  // Colors.slateDark.slate8,
  // Colors.slateDark.slate9,
  // Colors.slateDark.slate10,
  // Colors.slateDark.slate11,
  // Colors.slateDark.slate12,
  // Colors.whiteA.whiteA1,
  // Colors.whiteA.whiteA2,
  // Colors.whiteA.whiteA3,
  // Colors.whiteA.whiteA4,
  // Colors.whiteA.whiteA5,
  // Colors.whiteA.whiteA6,
  // Colors.whiteA.whiteA7,
  // Colors.whiteA.whiteA8,
  // Colors.whiteA.whiteA9,
  // Colors.whiteA.whiteA10,
  // Colors.whiteA.whiteA11,
  // Colors.whiteA.whiteA12,
];

const lightPalette = [
  Colors.gray.gray1,
  Colors.gray.gray2,
  Colors.gray.gray3,
  Colors.gray.gray4,
  Colors.gray.gray5,
  Colors.gray.gray6,
  Colors.gray.gray7,
  Colors.gray.gray8,
  Colors.gray.gray9,
  Colors.gray.gray10,
  Colors.gray.gray11,
  Colors.gray.gray12,
  // Colors.slate.slate1,
  // Colors.slate.slate2,
  // Colors.slate.slate3,
  // Colors.slate.slate4,
  // Colors.slate.slate5,
  // Colors.slate.slate6,
  // Colors.slate.slate7,
  // Colors.slate.slate8,
  // Colors.slate.slate9,
  // Colors.slate.slate10,
  // Colors.slate.slate11,
  // Colors.slate.slate12,
];

const lightShadows = {
  shadow1: Colors.blackA.blackA5,
  shadow2: Colors.blackA.blackA6,
  shadow3: Colors.blackA.blackA7,
  shadow4: Colors.blackA.blackA8,
  shadow5: Colors.blackA.blackA9,
  shadow6: Colors.blackA.blackA10,
};

const darkShadows = {
  shadow1: Colors.blackA.blackA2,
  shadow2: Colors.blackA.blackA3,
  shadow3: Colors.blackA.blackA4,
  shadow4: Colors.blackA.blackA5,
  shadow5: Colors.blackA.blackA6,
  shadow6: Colors.blackA.blackA7,
};

// we're adding some example sub-themes for you to show how they are done, "success" "warning", "error":

const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...Colors.green,
        ...Colors.red,
        ...Colors.yellow,
        ...Colors.slate,
        ...Colors.yellow,
        ...Colors.slate,
        ...Colors.sky,
        ...Colors.brown,
        ...Colors.pink,
        ...Colors.teal,
        ...Colors.violet,
        ...Colors.orange,
        ...Colors.cyan,
        ...Colors.purple,
        ...Colors.mint,
        ...Colors.indigo,
        ...Colors.lime,
        ...Colors.amber,
        ...Colors.gray,
        ...Colors.gold,
        ...Colors.bronze,
        ...Colors.slate,
        ...Colors.sky,
        ...Colors.brown,
        ...Colors.pink,
        ...Colors.teal,
        ...Colors.violet,
        ...Colors.orange,
        ...Colors.cyan,
        ...Colors.purple,
        ...Colors.mint,
        ...Colors.indigo,
        ...Colors.lime,
        ...Colors.amber,
        ...Colors.gray,
        ...Colors.gold,
        ...Colors.bronze,
        ...Colors.blue,
        ...lightShadows,
        shadowColor: Colors.blackA.blackA11,
        primary: '#339AF0',
        gray1: Colors.gray.gray1,
        gray2: Colors.gray.gray2,
        gray3: Colors.gray.gray3,
        gray4: Colors.gray.gray4,
        gray5: Colors.gray.gray5,
        gray6: Colors.gray.gray6,
        gray7: Colors.gray.gray7,
        gray8: Colors.gray.gray8,
        gray9: Colors.gray.gray9,
        gray10: Colors.gray.gray10,
        gray11: Colors.gray.gray11,
        gray12: Colors.gray.gray12,
        cardBg: Colors.whiteA.whiteA1,
        bgApp: '#FFFFFF',
      },
      dark: {
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...Colors.slateDark,
        ...Colors.yellowDark,
        ...Colors.slateDark,
        ...Colors.skyDark,
        ...Colors.brownDark,
        ...Colors.pinkDark,
        ...Colors.tealDark,
        ...Colors.violetDark,
        ...Colors.orangeDark,
        ...Colors.cyanDark,
        ...Colors.purpleDark,
        ...Colors.mintDark,
        ...Colors.indigoDark,
        ...Colors.limeDark,
        ...Colors.amberDark,
        ...Colors.grayDark,
        ...Colors.goldDark,
        ...Colors.bronzeDark,
        ...Colors.slateDark,
        ...Colors.skyDark,
        ...Colors.brownDark,
        ...Colors.pinkDark,
        ...Colors.tealDark,
        ...Colors.violetDark,
        ...Colors.orangeDark,
        ...Colors.cyanDark,
        ...Colors.purpleDark,
        ...Colors.mintDark,
        ...Colors.indigoDark,
        ...Colors.limeDark,
        ...Colors.amberDark,
        ...Colors.grayDark,
        ...Colors.goldDark,
        ...Colors.blue,
        ...Colors.bronzeDark,
        ...darkShadows,
        shadowColor: Colors.blackA.blackA11,
        primary: '#339AF0',
        gray1: Colors.grayDark.gray1,
        gray2: Colors.grayDark.gray2,
        gray3: Colors.grayDark.gray3,
        gray4: Colors.grayDark.gray4,
        gray5: Colors.grayDark.gray5,
        gray6: Colors.grayDark.gray6,
        gray7: Colors.grayDark.gray7,
        gray8: Colors.grayDark.gray8,
        gray9: Colors.grayDark.gray9,
        gray10: Colors.grayDark.gray10,
        gray11: Colors.grayDark.gray11,
        gray12: Colors.grayDark.gray12,
        cardBg: Colors.grayDark.gray1,
        bgApp: '#000000',
      },
    },
  },

  accent: {
    palette: {
      dark: [
        'hsla(250, 50%, 35%, 1)',
        'hsla(249, 50%, 38%, 1)',
        'hsla(247, 50%, 41%, 1)',
        'hsla(246, 50%, 43%, 1)',
        'hsla(244, 50%, 46%, 1)',
        'hsla(243, 50%, 49%, 1)',
        'hsla(241, 50%, 52%, 1)',
        'hsla(240, 50%, 54%, 1)',
        'hsla(238, 50%, 57%, 1)',
        'hsla(237, 50%, 60%, 1)',
        'hsla(250, 50%, 90%, 1)',
        'hsla(250, 50%, 95%, 1)',
      ],
      light: [
        'hsla(250, 50%, 40%, 1)',
        'hsla(249, 50%, 43%, 1)',
        'hsla(247, 50%, 46%, 1)',
        'hsla(246, 50%, 48%, 1)',
        'hsla(244, 50%, 51%, 1)',
        'hsla(243, 50%, 54%, 1)',
        'hsla(241, 50%, 57%, 1)',
        'hsla(240, 50%, 59%, 1)',
        'hsla(238, 50%, 62%, 1)',
        'hsla(237, 50%, 65%, 1)',
        'hsla(250, 50%, 95%, 1)',
        'hsla(250, 50%, 95%, 1)',
      ],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },
  },

  // optionally add more, can pass palette or template

  // grandChildrenThemes: {
  //   alt1: {
  //     template: 'alt1',
  //   },
  //   alt2: {
  //     template: 'alt2',
  //   },
  //   surface1: {
  //     template: 'surface1',
  //   },
  //   surface2: {
  //     template: 'surface2',
  //   },
  //   surface3: {
  //     template: 'surface3',
  //   },
  // },

  grandChildrenThemes: {},
});

export type Themes = typeof builtThemes;

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  // process.env.TAMAGUI_ENVIRONMENT === 'client' &&
  // process.env.NODE_ENV === 'production'
  //   ? ({} as any)
  builtThemes as any;
