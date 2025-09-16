import { YStack } from 'tamagui';

import React from 'react';

import { Redirect, SplashScreen } from 'expo-router';

import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';


SplashScreen.preventAutoHideAsync();

export default function Page() {
  const { user } = useAppStore();

  if (user) {
    return (
      <YStack justify="center">
        <Redirect href={Routes.BUDGETS} />
      </YStack>
    );
  }

  return (
    <YStack justify="center">
      <Redirect href={Routes.LOGIN} />
    </YStack>
  );
}
