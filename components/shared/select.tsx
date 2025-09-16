import {
  Adapt,
  AnimatePresence,
  Label,
  Select,
  Sheet,
  Text,
  YStack,
} from 'tamagui';

import React from 'react';

import { UI } from '@constants/app';
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons';

import type { SizeTokens, TamaguiTextElement } from 'tamagui';

export type ItemSelect = {
  id: string;
  name: string;
};

type SelectItemProps = {
  value?: ItemSelect;
  defaultValue?: ItemSelect;
  label: string;
  name?: string;
  error?: string;
  placeholder?: string;
  items: Array<ItemSelect>;
  onChange?: (item: ItemSelect) => void;
};

const SelectCustom = React.forwardRef<TamaguiTextElement, SelectItemProps>(
  (props: SelectItemProps, ref) => {
    const {
      name,
      error,
      items,
      value,
      defaultValue,
      placeholder,
      label,
      onChange,
    } = props;

    const [valueSelected, setValueSelected] = React.useState<
      ItemSelect | undefined
    >(value);

    React.useEffect(() => {
      setValueSelected(value);
    }, [value]);

    return (
      <YStack>
        <Label
          color="$gray12"
          fontSize="$3"
          fontWeight="600"
          lineHeight="$6"
          mb="$0"
          pb="$0"
        >
          {label}
        </Label>
        <Select
          defaultValue={defaultValue?.name}
          id={name}
          name={name}
          native={false}
          size={UI.Size as SizeTokens}
          value={valueSelected?.name}
          onValueChange={(v) => {
            if (onChange) {
              const item = items.find((i) => i.name === v);
              if (item) {
                onChange(item);
              }
            }
          }}
        >
          <Select.Trigger disabled={items.length === 0} iconAfter={ChevronDown}>
            <Select.Value placeholder={placeholder} ref={ref} />
          </Select.Trigger>

          <Adapt platform="touch">
            <Sheet
              dismissOnSnapToBottom
              modal
              moveOnKeyboardChange
              native={false}
              // snapPoints={[items.length > 8 ? 60 : 35]}
              snapPointsMode="fit"
            >
              <Sheet.Overlay
                animation="quick"
                bg="$shadowColor"
                enterStyle={{ opacity: 1 }}
                exitStyle={{ opacity: 0 }}
              />
              <Sheet.Handle bg="white" />

              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton
              height="$3"
              items="center"
              justify="center"
              position="relative"
              width="100%"
            >
              <YStack>
                <ChevronUp size={20} />
              </YStack>
            </Select.ScrollUpButton>
            <Select.Viewport minW={200}>
              <Select.Group>
                <Select.Label>{label}</Select.Label>
                {items.map((item, i) => {
                  return (
                    <Select.Item
                      index={i}
                      key={`${item.name}-${i}`}
                      mb={i === items.length - 1 ? '$10' : '$0'}
                      value={item.name}
                    >
                      <Select.ItemText>{item.name}</Select.ItemText>
                      <Select.ItemIndicator marginLeft="auto">
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  );
                })}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton
              height="$3"
              items="center"
              justify="center"
              position="relative"
              width="100%"
            >
              <YStack>
                <ChevronDown size={20} />
              </YStack>
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>
        <AnimatePresence initial={false}>
          {error && (
            <Text
              animation="quick"
              color="$red9"
              enterStyle={{
                opacity: 0,
                scale: 0.7,
              }}
              exitStyle={{
                opacity: 1,
              }}
              fontSize="$textXs"
              pl="$2"
            >
              {error}
            </Text>
          )}
        </AnimatePresence>
      </YStack>
    );
  }
);

export default SelectCustom;
