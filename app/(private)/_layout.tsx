import * as Burnt from 'burnt';
import { Stack } from 'expo-router/stack';
import moment from 'moment';
import { Text } from 'tamagui';

import React from 'react';

import { AppState } from 'react-native';

import { BlurView } from 'expo-blur';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import AlertDialog from '@components/shared/dialog';
import { useStackScreenOptions } from '@config/screens';
import { MIN_BIOMETRIC_TIME, MIN_CHECK_UPDATE_TIME } from '@constants/app';
import QKeys from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { ProductID, openAppStore } from '@modules/app-store-update';
import { useAppStore } from '@store/index';
import { useQuery } from '@tanstack/react-query';
import { Logger } from '@utils/log';
import { isLoadingRefetchQuery } from '@utils/network';
import { isAndroid, isIOS } from '@utils/platform';
import { getBgColor } from '@utils/styles';
import { checkUpdateAvailable } from '@utils/update';

export { ErrorBoundary } from 'expo-router';

export default function Layout() {
  const { theme } = useAppStore();

  const [isUpdate, setIsUpdate] = React.useState<boolean>(false);

  const [screenState, setScreenState] = React.useState<'active' | 'background'>(
    'active'
  );

  const {
    activeTimestamp,
    backgroundTimestamp,
    lastCheckUpdate,
    setLastCheckUpdate,
    setRequiredBiometric,
    clear,
    setUser,
  } = useAppStore();

  const colorBg = getBgColor(theme);

  const scheduleBudgetConfig = useStackScreenOptions({
    headerTitle: (
      <Text color="$primary" fontSize="$textLg">
        Schedule
      </Text>
    ),
  });

  const categoryFormConfig = useStackScreenOptions({
    headerTitle: (
      <Text color="$primary" fontSize="$textLg">
        Category
      </Text>
    ),
  });

  const biometricSettingQuery = useQuery<boolean, Error>({
    refetchOnWindowFocus: true,
    enabled: isEnableBiometric(),
    queryKey: [
      BIOMETRIC_CHECK_QUERY,
      screenState,
      activeTimestamp,
      backgroundTimestamp,
    ],
    queryFn: async () => {
      if (!isEnableBiometric()) {
        setRequiredBiometric(false);
        return true;
      }

      const biometricSetting = await DataRepo.userService.getCheckBiometric();

      if (biometricSetting) {
        const localAuthResult = await DataRepo.userService.checkBiometric();

        if (localAuthResult) {
          setRequiredBiometric(false);
          return true;
        }

        clearStore();
        setRequiredBiometric(false);
        return false;
      }

      setRequiredBiometric(false);
      return true;
    },
  });

  const updateQuery = useQuery<boolean, Error>({
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: isDelayToCheckUpdate(),
    queryKey: [
      CHECK_UPDATE_QUERY,
      lastCheckUpdate,
      screenState,
      moment().unix(),
    ],
    queryFn: async () => {
      if (!isDelayToCheckUpdate()) {
        setIsUpdate(false);
        return false;
      }

      setLastCheckUpdate(moment().unix());
      const result = await checkUpdateAvailable();

      setIsUpdate(result);
      return result;
    },
  });

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setScreenState('active');
        setRequiredBiometric(false);
      } else {
        setScreenState('background');
        setRequiredBiometric(true);
      }
    });

    return () => {
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (updateQuery.error) {
      Burnt.toast({
        preset: 'error',
        title: 'Error checking update',
        message: updateQuery.error.message,
      });
    }
  }, [updateQuery.error, updateQuery.status]);

  return (
    <React.Fragment>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: colorBg,
          },
          statusBarHidden: isAndroid ? false : undefined,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="budgetView/[id]" options={scheduleBudgetConfig} />
        <Stack.Screen
          name="budget"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="charge"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chargeView"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="category/[id]" options={categoryFormConfig} />
      </Stack>

      <AlertDialog
        colorCancel="gray"
        colorConfirm="green"
        content={getDescription()}
        open={isUpdate}
        textCancel="Later"
        textConfirm="Update"
        title="Update available"
        onCancel={() => {
          setIsUpdate(false);
        }}
        onConfirm={() => {
          if (isIOS) {
            openAppStore(ProductID).then(() => {
              setIsUpdate(false);
            });
          } else {
            Linking.openURL(
              'https://play.google.com/store/apps/details?id=budgetfy.cardor'
            )
              .then(() => {
                setIsUpdate(false);
              })
              .catch(() =>
                Linking.openURL(
                  'https://play.google.com/apps/testing/budgetfy.cardor'
                )
                  .then(() => {
                    setIsUpdate(false);
                  })
                  .catch((e) => Logger.error(e))
              );
          }
        }}
        onOpenChange={(v) => {
          if (!v) {
            setIsUpdate(false);
          }
        }}
      />

      {(screenState !== 'active' ||
        isLoadingRefetchQuery(biometricSettingQuery)) && (
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={85}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '200%',
          }}
        />
      )}
    </React.Fragment>
  );

  function getDescription() {
    const message = `A new version is available`;
    if (isIOS) {
      return `${message}. Update now to get the latest features and improvements.`;
    }
    return `${message}. Please, go to the Play Store to update.`;
  }

  function isEnableBiometric() {
    return Boolean(
      screenState === 'active' &&
        activeTimestamp &&
        backgroundTimestamp &&
        activeTimestamp - backgroundTimestamp > MIN_BIOMETRIC_TIME
    );
  }

  function isDelayToCheckUpdate() {
    if (screenState !== 'active') {
      return false;
    }

    if (!lastCheckUpdate) {
      return true;
    }

    const value =
      moment().diff(moment.unix(lastCheckUpdate), 'milliseconds') >
      MIN_CHECK_UPDATE_TIME;

    return value;
  }

  function clearStore() {
    router.navigate(Routes.LOGIN);
    DataRepo.userService.logout();
    clear();
    setUser();
    queryClient.clear();
  }
}
