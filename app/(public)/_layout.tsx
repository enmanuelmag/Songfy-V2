import { Stack } from 'expo-router/stack';

import { useAppStore } from '@store/index';
import { getBgColor } from '@utils/styles';

export default function Layout() {
  const { theme } = useAppStore();
  const colorBg = getBgColor(theme);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: false,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colorBg },
      }}
    />
  );
}
