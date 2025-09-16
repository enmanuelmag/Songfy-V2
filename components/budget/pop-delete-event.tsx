import { Separator, Text, XStack } from 'tamagui';

import React from 'react';

import ButtonCustom from '@components/shared/button';

import type { EventBaseType } from '@customTypes/budget';

type DeleteContentProps = {
  data: EventBaseType;
  setPopOver: (v: EventBaseType | null) => void;
  onDeleted: () => void;
};

function DeleteContent(props: DeleteContentProps) {
  const { data, setPopOver, onDeleted } = props;
  return (
    <React.Fragment>
      <Text color="$gray12" fontSize="$textXl" fontWeight="600">
        Delete event
      </Text>

      <Separator my="$3" />

      <Text color="$gray10" fontSize="$textMd">
        Are you sure you want to delete the event{' '}
        <Text color="$gray10" fontSize="$textMd" fontWeight="600">
          {data.name}
        </Text>
        ?
      </Text>
      <XStack gap="$2" justify="flex-end" mt="$3">
        <ButtonCustom
          color="red"
          fullWidth={false}
          text="Yes, delete"
          onPress={() => {
            onDeleted();
            setPopOver(null);
          }}
        />
        <ButtonCustom
          fullWidth={false}
          text="No, cancel"
          onPress={() => setPopOver(null)}
        />
      </XStack>
    </React.Fragment>
  );
}

export default DeleteContent;
