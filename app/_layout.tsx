import { SafeAreaView } from 'react-native-safe-area-context';
import { PortalProvider, TamaguiProvider, Theme } from 'tamagui';

import React from 'react';

import { Appearance } from 'react-native';

import * as Notifications from 'expo-notifications';
import { Slot, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import queryClient, { asyncStoragePersister } from '@api/datasource/query';
import tamaguiConfig from '@config/theme';
import { useAppStore } from '@store/index';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';



// NavigationBar.setPositionAsync('relative');
// NavigationBar.setVisibilityAsync('hidden');
// NavigationBar.setBehaviorAsync('inset-swipe');
// setStatusBarHidden(true, 'none');

const Provider = process.env.EXPO_PUBLIC_IS_DEV
  ? QueryClientProvider
  : PersistQueryClientProvider;

Notifications.setNotificationHandler({
  handleNotification: () =>
    new Promise((resolve) =>
      resolve({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      })
    ),
});

SplashScreen.preventAutoHideAsync();

export default function Page() {
  const { usedSystemTheme, theme, setTheme, setUsedSystemTheme } =
    useAppStore();

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  React.useEffect(() => {
    if (!usedSystemTheme) {
      const systemColorScheme = Appearance.getColorScheme();
      setTheme(systemColorScheme === 'light' ? 'light' : 'dark');
      setUsedSystemTheme(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedSystemTheme]);

  React.useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme === 'light' ? 'white' : 'black');
  }, [theme]);

  return (
    <Provider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
      }}
    >
      <TamaguiProvider config={tamaguiConfig}>
        <Theme name={theme}>
          <PortalProvider shouldAddRootHost>
            {theme === 'dark' && (
              <StatusBar translucent backgroundColor="#000" style="light" />
            )}
            <SafeAreaView
              edges={['top', 'left', 'right']}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                marginBottom: 0,
                paddingBottom: 0,
              }}
            >
              <Slot />
            </SafeAreaView>
          </PortalProvider>
        </Theme>
      </TamaguiProvider>
    </Provider>
  );
}
