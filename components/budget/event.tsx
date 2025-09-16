import { Card, Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Bell, Calendar, Clock, Edit3, Trash } from '@tamagui/lucide-icons';
import { getTimeEvent, getTimeFormat } from '@utils/budget';
import { vibration } from '@utils/haptics';
import { capitalize, formatCurrency } from '@utils/string';
import { getPeriod } from '@utils/time';


import ActionIcon from '../shared/action-icon';
import Chip from '../shared/chip';
import TextIcon from '../shared/text-icon';

import type { EventBaseType } from '@customTypes/budget';

type EventProps = {
  data: EventBaseType;
  onEdit?: () => void;
  onPress?: () => void;
  onDelete?: () => void;
};

const Event = (props: EventProps) => {
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
  data: EventBaseType;
};

export function EventDetail(props: EventDetailProps) {
  const {
    type,
    amount,
    repeat,
    category,
    timeNotification = {} as EventDetailProps['data']['timeNotification'],
  } = props.data;

  return (
    <YStack gap="$2">
      <XStack items="flex-start" justify="space-between" width="100%">
        <YStack gap="$2">
          <Text
            color={type === 'expense' ? '$red10' : '$green10'}
            fontSize="$textSm"
          >
            {formatCurrency(amount)}
          </Text>
          <TextIcon
            gap="$1.5"
            icon={<Clock color="$gray11" size={15} />}
            text={
              <Text color="$gray11" fontSize="$textSm">
                {getPeriod(repeat)}
              </Text>
            }
          />
        </YStack>
        {category && (
          <Chip color={category.color}>{capitalize(category.name)}</Chip>
        )}
      </XStack>

      <TextIcon
        gap="$1.5"
        icon={<Calendar color="$gray10" size={15} />}
        text={
          <Text color="$gray11" fontSize="$textSm">
            {getTimeEvent(props.data)}
          </Text>
        }
      />

      {timeNotification.enabled && (
        <TextIcon
          gap="$1.5"
          icon={<Bell color="$gray10" size={15} />}
          text={
            <Text color="$gray11" fontSize="$textSm">
              {getTimeFormat(timeNotification)}
            </Text>
          }
        />
      )}
    </YStack>
  );
}

export default Event;
