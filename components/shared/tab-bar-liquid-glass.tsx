import { View } from 'tamagui';

import React from 'react';

import { BlurView } from 'expo-blur';

import { useAppStore } from '@store/index';
import { getLiquidBorderColor } from '@utils/styles';

const TabBatLiquid = () => {
  const { theme } = useAppStore();

  const borderColor = getLiquidBorderColor();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BlurView
        experimentalBlurMethod="dimezisBlurView"
        intensity={22}
        style={{
          height: 55,
          width: '94%',
          borderRadius: 50,
          overflow: 'hidden',
          borderTopColor: borderColor,
          borderTopWidth: 1,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          borderLeftColor: borderColor,
          borderLeftWidth: 1,
          borderRightColor: borderColor,
          borderRightWidth: 1,
        }}
        tint={theme === 'dark' ? 'dark' : 'extraLight'}
      />
    </View>
  );
};

export default TabBatLiquid;
