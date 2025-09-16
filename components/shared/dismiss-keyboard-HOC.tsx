import { View } from 'tamagui';

import React from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { isIOS } from '@utils/platform';


type Props = {
  children: React.ReactNode;
};

const DismissKeyboardHOC = ({ children }: Props) => {
  const [keyboardStatus, setKeyboardStatus] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardStatus(true);
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardStatus(false);
      });
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, [])
  );

  return (
    <KeyboardAvoidingView
      enabled
      behavior={isIOS ? 'padding' : 'height'}
      contentContainerStyle={{ flex: 1 }}
      keyboardVerticalOffset={isIOS ? 90 : keyboardStatus ? 90 : 0}
      // style={{ flex: 1, height: '100%' }}
      style={{
        width: '100%',
      }}
    >
      <TouchableWithoutFeedback
        style={{ width: '100%' }}
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View width="100%">{children}</View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default DismissKeyboardHOC;
