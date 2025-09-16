import { router } from 'expo-router';

import { vibration } from './haptics';
import { Logger } from './log';

import type { RoutesType } from '@constants/routes';

type NavigateParams = {
  to?: RoutesType | 'back';
  params?: (Record<string, string | number> & {}) | null;
  options?: {
    haptic?: boolean;
  };
};

export const navigate = (args: NavigateParams) => {
  const { to, params, options } = args;
  if (!to) {
    Logger.error(`Route not found: ${to}`);
    return;
  }

  if (to === 'back') {
    router.back();
    return;
  }

  let url: string = to;

  if (params && Object.keys(params).length > 0) {
    url = Object.keys(params).reduce(
      (acc, key) => acc.replace(`:${key}`, params[key].toString()),
      url
    );
  }

  if (options?.haptic ?? true) {
    vibration('light');
  }

  router.push(url);
};
