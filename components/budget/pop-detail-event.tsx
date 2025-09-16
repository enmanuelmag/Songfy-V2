import { Separator, Text, YStack } from 'tamagui';

import React from 'react';

import { EventDetail } from './event';

import type { EventBaseType } from '@customTypes/budget';

type DetailContentProps = {
  data: EventBaseType;
};

function DetailContent(props: DetailContentProps) {
  const { data } = props;
  return (
    <React.Fragment>
      <YStack gap="$2">
        <Text color="$gray12" fontSize="$textLg" fontWeight="600">
          {data.name}
        </Text>
        {data.description && (
          <Text color="$gray10" fontSize="$textMd">
            {data.description}
          </Text>
        )}
      </YStack>

      <Separator my="$3" />

      <EventDetail data={data} />
    </React.Fragment>
  );
}

export default DetailContent;
