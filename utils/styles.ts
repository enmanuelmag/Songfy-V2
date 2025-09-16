import { useAppStore } from '@store/index';

export const $ = (...args: Array<any>) => args.filter(Boolean).join(' ');

export const getBgColor = (colorScheme: 'light' | 'dark' | undefined) => {
  return colorScheme === 'light' ? '#FFF' : '#000';
};

export const getLiquidBorderColor = () => {
  const { theme } = useAppStore.getState();

  return theme === 'dark' ? '#ffffff46' : '#00000010';
};
