import { Separator, Text, YStack } from 'tamagui';

import React from 'react';

import { router } from 'expo-router';

import VirtualizedList from '@components/shared/virtualized-list';
import SongListCard from '@components/song/song-list-card';
import QKeys from '@constants/react-api';
import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';
import { useQuery } from '@tanstack/react-query';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';

const Songs = () => {
  const { songsLyrics } = useAppStore();

  const songParseQuery = useQuery({
    retry: 1,
    refetchOnMount: true,
    enabled: !!songsLyrics,
    refetchOnWindowFocus: true,
    queryKey: [QKeys.LIST_SONG_PARSE_KEY, songsLyrics],
    queryFn: () => {
      const songs = Object.values(songsLyrics);

      return songs.filter(({ analysis, lyrics }) =>
        Boolean(lyrics && analysis?.brief && analysis.keywords.length)
      );
    },
  });

  return (
    <YStack bg="$bgApp" height="100%">
      <Text color="$gray11" fontSize="$textMd">
        You can edit insights tapping on the song
      </Text>

      <Separator my="$4" />

      <VirtualizedList
        items={songParseQuery.data || []}
        loading={isLoadingRefetchQuery(songParseQuery)}
        // add onEndReached to fetch more data
        renderItem={({ item, index }) => (
          <SongListCard
            data={item}
            key={`song-${index}`}
            onPress={() => {
              vibration('light');
              router.push(Routes.SONG.replace(':id', item.id));
            }}
          />
        )}
      />
    </YStack>
  );
};

export default Songs;
