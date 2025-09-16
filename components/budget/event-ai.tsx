import moment from 'moment';
import { Card, Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Calendar, Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';
import { formatCurrency } from '@utils/string';

import ActionIcon from '../shared/action-icon';
import TextIcon from '../shared/text-icon';

import type { AIDetectedEventType } from '@customTypes/ai-event-detected';

type EventAIProps = {
  data: AIDetectedEventType;
  onEdit?: () => void;
  onPress?: () => void;
  onDelete?: () => void;
};

const EventAI = (props: EventAIProps) => {
  const {
    data: { name },
    onEdit,
    onDelete,
    onPress,
  } = props;

  return (
    <Card bordered bg="$cardBg" size="$2" onPress={() => onPress?.()}>
      <Card.Header px="$4" py="$2">
        <XStack items="center" justify="space-between">
          <View>
            <Text color="$gray12" fontSize="$textMd">
              {name}
            </Text>
          </View>
          <XStack gap="$3">
            {onEdit && (
              <ActionIcon
                onlyIcon
                icon={<Edit3 color="$gray12" size={18} />}
                variant="icon"
                onPress={() => {
                  vibration();
                  onEdit();
                }}
              />
            )}
            {onDelete && (
              <ActionIcon
                onlyIcon
                icon={<Trash color="$red10" size={18} />}
                variant="icon"
                onPress={onDelete}
              />
            )}
          </XStack>
        </XStack>
      </Card.Header>
      <Separator my="$1" />
      <Card.Footer px="$4" py="$2">
        <EventDetail data={props.data} />
      </Card.Footer>
    </Card>
  );
};

type EventDetailProps = {
  data: AIDetectedEventType;
};

export function EventDetail(props: EventDetailProps) {
  const { type, amount } = props.data;

  return (
    <YStack gap="$2">
      <XStack items="flex-start" justify="space-between" width="100%">
        <YStack gap="$2">
          <Text
            color={type === 'expense' ? '$red10' : '$green10'}
            fontSize="$textSm"
          >
            {formatCurrency(amount.value)}
          </Text>
        </YStack>
      </XStack>

      <TextIcon
        gap="$1.5"
        icon={<Calendar color="$gray10" size={15} />}
        text={
          <Text color="$gray11" fontSize="$textSm">
            {moment.unix(props.data.estimatedDate).format('DD/MM/YYYY')}
          </Text>
        }
      />
    </YStack>
  );
}

export default EventAI;
