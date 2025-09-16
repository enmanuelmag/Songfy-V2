import { Label, Switch, Text, XStack, YStack } from 'tamagui';

import React from 'react';

import type { TamaguiElement } from 'tamagui';

type SwitchProps = {
  fullWidth?: boolean;
  defaultChecked?: boolean;
  value?: boolean;
  label: string;
  description?: string;
  name?: string;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
};

const activeColor = 'blue';

const inactiveColor = 'gray';

const SwitchWithLabel = React.forwardRef<TamaguiElement, SwitchProps>(
  (props: SwitchProps, ref) => {
    const {
      fullWidth,
      description,
      label,
      name,
      disabled,
      defaultChecked,
      value,
      onChange,
    } = props;

    return (
      <XStack
        content="center"
        gap={fullWidth ? '$0' : '$4'}
        items="center"
        justify={fullWidth ? 'space-between' : 'flex-start'}
        position="relative"
        width={fullWidth ? '100%' : undefined}
        onPress={() => {}}
      >
        <YStack flexBasis={fullWidth ? '80%' : undefined}>
          <Label
            color="$gray12"
            fontSize="$textSm"
            fontWeight="600"
            lineHeight={14}
          >
            {label}
          </Label>
          {description && (
            <Text fontSize="$textSm" lineHeight={14} mt="$1">
              {description}
            </Text>
          )}
        </YStack>
        <XStack flexBasis={fullWidth ? '20%' : undefined} justify="flex-end">
          <Switch
            bg={value ? activeColor : inactiveColor}
            borderColor={value ? activeColor : inactiveColor}
            checked={value}
            defaultChecked={defaultChecked}
            disabled={disabled}
            id={`${name}-switch-${defaultChecked}}`}
            native="ios"
            ref={ref}
            onCheckedChange={(v) => {
              onChange && onChange(v);
            }}
          >
            <Switch.Thumb animation="quick" bg="white" />
          </Switch>
        </XStack>
      </XStack>
    );
  }
);

export default SwitchWithLabel;
