import { AlertDialog as AlertTama, Text, XStack, YStack } from 'tamagui';

import React from 'react';

import ButtonCustom from './button';

import type colors from 'tailwindcss/colors';

type AlertTamaProps = {
  open?: boolean;
  title: string;
  children?: React.ReactNode;
  content: string | React.ReactNode;
  textConfirm?: string;
  colorConfirm?: keyof typeof colors;
  textCancel?: string;
  colorCancel?: keyof typeof colors;
  onConfirm?: () => void;
  onCancel?: () => void;
  onOpenChange?: (boolean: boolean) => void;
};

export function AlertDialog(props: AlertTamaProps) {
  const {
    open,
    title,
    content,
    textConfirm,
    textCancel,
    children,
    colorCancel,
    colorConfirm,
    onCancel,
    onConfirm,
    onOpenChange,
  } = props;
  return (
    <AlertTama open={open} onOpenChange={(value) => onOpenChange?.(value)}>
      {children && <AlertTama.Trigger asChild>{children}</AlertTama.Trigger>}

      <AlertTama.Portal>
        <AlertTama.Overlay
          animation="quick"
          bg="$shadowColor"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          key="overlay"
        />
        <AlertTama.Content
          bordered
          elevate
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          key="content"
          mx="$2.5"
          opacity={1}
          scale={1}
          x={0}
          y={0}
        >
          <YStack gap="$3">
            <AlertTama.Title>
              <Text
                color="$gray12"
                fontSize="$text2Xl"
                fontWeight="600"
                onPress={() => null}
              >
                {title}
              </Text>
            </AlertTama.Title>
            <AlertTama.Description>
              {React.isValidElement(content) ? (
                content
              ) : (
                <Text
                  color="$gray11"
                  fontSize="$textMd"
                  fontWeight="400"
                  onPress={() => null}
                >
                  {content}
                </Text>
              )}
            </AlertTama.Description>

            {textConfirm && textCancel && (
              <XStack gap="$3" justify="flex-end">
                <AlertTama.Action asChild>
                  <ButtonCustom
                    color={colorConfirm || 'green'}
                    fullWidth={false}
                    text={textConfirm}
                    onPress={onConfirm}
                  />
                </AlertTama.Action>
                <AlertTama.Cancel asChild>
                  <ButtonCustom
                    color={colorCancel || 'red'}
                    fullWidth={false}
                    text={textCancel}
                    onPress={onCancel}
                  />
                </AlertTama.Cancel>
              </XStack>
            )}
          </YStack>
        </AlertTama.Content>
      </AlertTama.Portal>
    </AlertTama>
  );
}

export default AlertDialog;
