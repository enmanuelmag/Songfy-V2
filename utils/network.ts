import { Platform } from 'react-native';

import { focusManager } from '@tanstack/react-query';

import type { UseQueryResult } from '@tanstack/react-query';
import type { AppStateStatus } from 'react-native';

export function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export const isLoadingQuery = (...results: Array<UseQueryResult>) => {
  return results.some((r) => r.isFetching);
};

export const isLoadingRefetchQuery = (...results: Array<UseQueryResult>) => {
  return results.some((r) => r.isFetching || r.isLoading);
};

export const isLoadingMutation = (...results: Array<any>) => {
  return results.some((r) => r.isPending && !r.isIdle);
};
