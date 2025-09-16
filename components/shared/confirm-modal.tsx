import { Separator, Sheet, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { vibration } from '@utils/haptics';

import ButtonCustom from './button';

import type colors from 'tailwindcss/colors';

type ConfirmEventProps = {
  title: string;
  content: string | React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  confirmColor?: keyof typeof colors;
  confirmText: string;
  onConfirm: () => void;
  closeText: string;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (boolean: boolean) => void;
};

const ConfirmModal = React.forwardRef<any, ConfirmEventProps>(
  (props: ConfirmEventProps, ref) => {
    const {
      open,
      title,
      loading,
      closeText,
      confirmText,
      confirmColor,
      content,
      children,
      onConfirm,
      onClose,
      onOpenChange,
    } = props;

    return (
      <React.Fragment>
        {children}
        <Sheet
          dismissOnSnapToBottom
          modal
          moveOnKeyboardChange
          open={open}
          position={0}
          ref={ref}
          snapPointsMode="fit"
          zIndex={100_000}
          onOpenChange={onOpenChange}
        >
          <Sheet.Overlay
            animation="lazy"
            bg="$shadowColor"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Sheet.Handle bg="white" />

          <Sheet.Frame gap="$2" justify="center" p="$3" pb="$5">
            <YStack gap="$2" p="$2">
              <Text color="$gray12" fontSize="$textXl" fontWeight="600">
                {title}
              </Text>

              <Separator my="$2" />

              <View>
                <React.Fragment>
                  {React.isValidElement(content) ? (
                    content
                  ) : (
                    <Text color="$gray11" fontSize="$textLg">
                      {content}
                    </Text>
                  )}
                </React.Fragment>
              </View>

              <XStack
                content="flex-end"
                gap="$3"
                justify="flex-end"
                mb="$2"
                mt="$3"
                self="flex-end"
              >
                <ButtonCustom
                  aria-label="Close"
                  color={confirmColor ?? 'red'}
                  fullWidth={false}
                  loading={loading}
                  text={confirmText}
                  variant="filled"
                  onPress={() => {
                    onOpenChange?.(false);
                    vibration('heavy');
                    onConfirm();
                  }}
                />
                <ButtonCustom
                  aria-label="Close"
                  color="gray"
                  fullWidth={false}
                  text={closeText}
                  variant="filled"
                  onPress={() => {
                    onOpenChange?.(false);
                    vibration('light');
                    onClose?.();
                  }}
                />
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </React.Fragment>
    );
  }
);

ConfirmModal.displayName = 'ConfirmModal';

export default ConfirmModal;
