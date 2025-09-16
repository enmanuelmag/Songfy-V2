import { Dimensions, Platform } from 'react-native';

const { height } = Dimensions.get('screen');

export const isIOS: boolean = Platform.OS === 'ios';

export const isIPad = Platform.OS === 'ios' && Platform.isPad;

export const isAndroid: boolean = Platform.OS === 'android';

export const getScrollGradient = (yOffset: number) => {
  const result = {
    top: false,
    bottom: true,
  };

  if (yOffset > 0.05) {
    result.top = true;
  }
  if (yOffset > height * 0.85) {
    result.bottom = false;
  }

  return result;
};
