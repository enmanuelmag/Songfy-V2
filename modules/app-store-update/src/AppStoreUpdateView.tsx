import * as React from 'react';

import { requireNativeViewManager } from 'expo-modules-core';

import type { AppStoreUpdateViewProps } from './AppStoreUpdate.types';

const NativeView: React.ComponentType<AppStoreUpdateViewProps> =
  requireNativeViewManager('AppStoreUpdate');

export default function AppStoreUpdateView(props: AppStoreUpdateViewProps) {
  return <NativeView {...props} />;
}
