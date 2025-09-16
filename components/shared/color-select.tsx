import { Circle, Text, XStack } from 'tamagui';

import { TouchableOpacity } from 'react-native';

import { Colors } from '@constants/budget';
import { capitalize } from '@utils/string';


import GradientList from './gradient-list';
import PopOver from './pop-over';

type CategorySelectProps = {
  color: string;
  open?: boolean;
  setOpen: (value: boolean) => void;
  onChange: (value: string) => void;
};

function ColorSelect(props: CategorySelectProps) {
  const { open, color, onChange, setOpen } = props;

  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          {Object.keys(Colors).map((colorKey) => (
            <XStack
              gap="$2"
              key={colorKey}
              mb="$4"
              onPress={() => {
                onChange(colorKey);
              }}
            >
              <Circle
                bg={
                  Colors[colorKey as keyof typeof Colors][500] as `#${string}`
                }
                size={24}
              />
              <Text color="$gray11" fontSize="$textMd">
                {capitalize(colorKey)}
              </Text>
            </XStack>
          ))}
        </GradientList>
      }
      open={open}
      snapPointsMode="percent"
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setOpen(true);
        }}
      >
        <XStack bg="$gray6" justify="center" py={8} rounded="$5">
          <Circle
            bg={Colors[color as keyof typeof Colors][500] as `#${string}`}
            size={24}
          />
        </XStack>
      </TouchableOpacity>
    </PopOver>
  );
}

export default ColorSelect;
