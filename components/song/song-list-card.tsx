import { Card, Text, XStack, YStack } from 'tamagui';

import React from 'react';

import { Image } from 'expo-image';

import ActionIcon from '@components/shared/action-icon';
import { blurhash } from '@constants/image';
import { Clock } from '@tamagui/lucide-icons';
import { parseDuration } from '@utils/spotify';

import type { SongLyricsType } from '@customTypes/spotify';

type SongListCardProps = {
  data: SongLyricsType;
  onPress: () => void;
};

const SongListCard = (props: SongListCardProps) => {
  const { data, onPress } = props;

  const { name, id, album, artists, duration_ms } = data;

  const { images } = album;

  return (
    <Card bordered bg="$cardBg" borderRadius="$3" key={id} onPress={onPress}>
      <XStack className="cd-relative" flexWrap="wrap" justify="space-between">
        <YStack flexBasis="75%" justify="flex-start">
          <Card.Header
            flex={1}
            flexDirection="column"
            gap="$3"
            justify="space-between"
            px="$3"
            py="$2"
          >
            <YStack>
              <Text
                ellipse
                color="$gray12"
                fontSize="$textMd"
                numberOfLines={1}
              >
                {name}
              </Text>

              <Text
                ellipse
                color="$gray11"
                fontSize="$textSm"
                numberOfLines={1}
              >
                {artists
                  .map((artist) => artist.name)
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </YStack>

            <XStack gap="$2" justify="flex-start">
              <ActionIcon
                onlyIcon
                color="gray"
                icon={<Clock size={16} />}
                variant="icon"
              />

              <Text color="$gray11" fontSize="$textSm">
                {parseDuration(duration_ms)}
              </Text>
            </XStack>
          </Card.Header>
        </YStack>
        {images.length > 0 && (
          <Image
            // className="cd-basis-[25%] cd-h-full cd-aspect-square cd-object-cover cd-rounded-br-md cd-rounded-tr-md"
            contentFit="cover"
            key={`${id}-image`}
            placeholder={{ blurhash }}
            source={{ uri: images[0].url }}
            style={{ width: '100%', height: '100%' }}
            transition={1000}
          />
        )}
      </XStack>
    </Card>
  );
};

export default SongListCard;
