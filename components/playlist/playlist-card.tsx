import { Card, Text, XStack, YStack } from 'tamagui';

import React from 'react';

import { Image } from 'expo-image';

import ActionIcon from '@components/shared/action-icon';
import { blurhash } from '@constants/image';
import { ListMusic } from '@tamagui/lucide-icons';

import type { PlaylistType } from '@customTypes/spotify';

type PlaylistCardProps = {
  data: PlaylistType;
  onPress: () => void;
};

const PlaylistCard = (props: PlaylistCardProps) => {
  const { data, onPress } = props;

  const { name, id, description, images, tracks } = data;

  const [image] = images;

  return (
    <Card bordered bg="$cardBg" borderRadius="$3" onPress={onPress}>
      <XStack flexWrap="wrap" justify="space-between" position="relative">
        <YStack flexBasis="65%" justify="flex-start">
          <Card.Header
            flex={1}
            flexDirection="column"
            justify="space-between"
            px="$3"
            py="$2"
          >
            <YStack gap="$2">
              <Text
                ellipse
                color="$gray12"
                fontSize="$textMd"
                numberOfLines={2}
              >
                {name}
              </Text>
              {Boolean(description?.length) && (
                <Text ellipse color="$gray11" fontSize="$4" numberOfLines={1}>
                  {description}
                </Text>
              )}
            </YStack>
            <XStack gap="$2">
              <ActionIcon
                onlyIcon
                color="gray"
                icon={<ListMusic size={16} />}
                variant="icon"
              />

              <Text color="$gray11" fontSize="$textSm">
                {tracks.total} tracks
              </Text>
            </XStack>
          </Card.Header>
        </YStack>
        <Image
          // className="cd-h-full cd-aspect-square cd-object-cover cd-rounded-br-md cd-rounded-tr-md cd-basis-[35%]"
          contentFit="cover"
          key={`${id}-image`}
          placeholder={{ blurhash }}
          source={{ uri: image.url }}
          style={{ width: '100%', height: '100%' }}
          transition={1000}
        />
      </XStack>
    </Card>
  );
};

export default PlaylistCard;
