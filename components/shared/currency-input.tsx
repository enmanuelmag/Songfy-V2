import CurrencyInput from 'react-native-currency-input';
import { AnimatePresence, Input, Label, Text, YStack } from 'tamagui';

import React from 'react';

import { Keyboard } from 'react-native';

import { UI } from '@constants/app';
import { useAppStore } from '@store/index';


import type { TextInput } from 'react-native';
import type { SizeTokens } from 'tamagui';

type CurrencyInputProps = {
  symbol?: string;
  error?: string;
  value?: number | null;
  label: string;
  description?: string;
  placeholder: string;
  separator?: string;
  delimiter?: string;
  precision?: number;
  onChange: (value: number) => void;
};

const CurrencyInputCustom = React.forwardRef<TextInput, CurrencyInputProps>(
  (props: CurrencyInputProps, ref) => {
    const { currency } = useAppStore();

    const {
      delimiter = '.',
      separator = ',',
      precision = 2,
      label,
      description,
      placeholder,
      symbol,
      error,
      value = 0,
      onChange,
    } = props;

    return (
      <CurrencyInput
        delimiter={delimiter}
        minValue={0}
        precision={precision}
        prefix={symbol || currency.symbol}
        ref={ref}
        renderTextInput={(textInputProps) => (
          <YStack gap={0} onPress={() => null}>
            {label && (
              <Label
                fontSize="$3"
                fontWeight="600"
                lineHeight="$6"
                onPress={() => Keyboard.dismiss()}
              >
                {label}
              </Label>
            )}
            <Input
              {...textInputProps}
              placeholder={placeholder}
              size={UI.Size as SizeTokens}
            />
            {!error && description && (
              <Text fontSize="$textXs" fontWeight="400" mt="$2">
                {description}
              </Text>
            )}
            <AnimatePresence initial={false}>
              {error && (
                <Text
                  animation="quick"
                  color="red"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.7,
                  }}
                  exitStyle={{
                    opacity: 1,
                  }}
                  fontSize="$textMd"
                  fontWeight="300"
                  mt="$1.5"
                >
                  {error}
                </Text>
              )}
            </AnimatePresence>
          </YStack>
        )}
        separator={separator}
        value={value}
        onChangeValue={(v) => onChange(Number(v))}
      />
    );
  }
);

export default CurrencyInputCustom;
