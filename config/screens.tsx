import React from 'react';

import { router } from 'expo-router';

import ActionIcon from '@components/shared/action-icon';
import { useAppStore } from '@store/index';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';
import { getBgColor } from '@utils/styles';

import type { ScreenProps } from 'expo-router/build/useScreens';

type StackScreenParams = void | {
  headerTitle?: React.ReactElement | void;
};

export const useStackScreenOptions = (
  params: StackScreenParams
): ScreenProps['options'] => {
  const { theme } = useAppStore();
  const colorBg = getBgColor(theme);

  const option: ScreenProps['options'] = {
    headerShown: true,
    headerTransparent: false,
    headerBackVisible: false,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: 'transparent' },
    contentStyle: { backgroundColor: colorBg },
    headerLeft: () => (
      <ActionIcon
        onlyIcon
        icon={<ChevronLeft color="$gray12" size="$1" />}
        variant="icon"
        onPress={() => {
          vibration();
          router.back();
        }}
      />
    ),
    headerTitle: () => params?.headerTitle,
  };
  return option;
};

type TabScreenParams = {
  title: string;
  headerTitle?: React.ReactElement;
  headerRight?: React.ReactElement;
  headerLeft?: React.ReactElement;
  Icon: any;
  sizeIcon?: number;
};

export const useTabsScreenOptions = (
  params: TabScreenParams
): ScreenProps['options'] => {
  const { title, Icon, sizeIcon, headerTitle, headerRight, headerLeft } =
    params;

  const { theme } = useAppStore();
  const colorBg = getBgColor(theme);

  return {
    title,
    headerShown: true,
    headerTransparent: false,
    headerBackVisible: false,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerStyle: { backgroundColor: colorBg },
    contentStyle: { backgroundColor: colorBg },
    headerTitle: () => headerTitle,
    headerLeft: headerLeft ? () => headerLeft : undefined,
    headerRight: headerRight ? () => headerRight : undefined,
    tabBarIcon: ({ color }: { color: string }) => (
      <Icon color={color} size={sizeIcon || 24} />
    ),
  };
};
