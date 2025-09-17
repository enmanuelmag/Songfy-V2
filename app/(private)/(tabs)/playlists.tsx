import { Separator, Text, YStack } from 'tamagui';
import { useShallow } from 'zustand/react/shallow';

import React from 'react';

import { Stack } from 'expo-router';

import DataRepo from '@api/datasource';
import PlaylistAnalyzePop from '@components/playlist/playlist-analyze-pop';
import PlaylistCard from '@components/playlist/playlist-card';
import ActionIcon from '@components/shared/action-icon';
import ConfirmModal from '@components/shared/confirm-modal';
import AlertDialog from '@components/shared/dialog';
import VirtualizedList from '@components/shared/virtualized-list';
import QKeys from '@constants/react-api';
import { useAppStore } from '@store/index';
import { RefreshCcw } from '@tamagui/lucide-icons';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { vibration } from '@utils/haptics';
import { toast } from '@utils/notifications';

import type { PageType } from '@customTypes/network';
import type { AnalyzeSongParamsType } from '@customTypes/open-ai';
import type { PlaylistResponseType, PlaylistType } from '@customTypes/spotify';
import type { InfiniteData } from '@tanstack/react-query';

const Playlist = () => {
  const {
    tokenSentAt,
    stepTextAnalysis,
    setStepTextAnalysis,
    playlists,
    songsLyrics,
    isLimitEnabled,
    setPlaylists,
    setTokenExpired,
  } = useAppStore();

  const putSongLyrics = useAppStore(useShallow((state) => state.putSongLyrics));

  const [playlistPopOver, setPlaylistPopOver] =
    React.useState<PlaylistType | null>(null);

  const [syncingPlaylist, setSyncingPlaylist] = React.useState(false);

  const spotifyCheckTokenQuery = useQuery({
    retry: 1,
    refetchOnMount: true,
    enabled: !!tokenSentAt,
    refetchOnWindowFocus: true,
    queryKey: [QKeys.CHECK_SPOTIFY_TOKEN_KEY, tokenSentAt],
    queryFn: async () => {
      const result = await DataRepo.spotifyService.checkToken(tokenSentAt);

      if (!result) {
        setTokenExpired(true);
      }

      return result;
    },
  });

  const playlistInfiniteQuery = useInfiniteQuery<
    PlaylistResponseType,
    Error,
    InfiniteData<PlaylistResponseType>,
    Array<string>,
    PageType
  >({
    retry: 1,
    enabled: spotifyCheckTokenQuery.data && playlists.length === 0,
    queryKey: [QKeys.GET_PLAYLISTS_KEY],
    initialPageParam: {
      offset: 0,
      limit: 50,
    },
    getNextPageParam: (lastPage) => parseOffset(lastPage.next),
    queryFn: async ({ pageParam }) => {
      return await DataRepo.spotifyService.getPlaylists(pageParam);
    },
  });

  const analyzeSongsMutation = useMutation({
    retry: 2,
    mutationFn: async (data: AnalyzeSongParamsType) => {
      return await DataRepo.openAIService.analyzeSongs(data);
    },
    onSettled: (data, error) => {
      if (error) {
        toast({
          title: error.message || 'Error analyzing songs',
          preset: 'error',
        });
      } else if (data) {
        toast({
          title: 'Songs analyzed successfully',
          preset: 'done',
        });
      }
      setSyncingPlaylist(false);
    },
  });

  React.useEffect(() => {
    if (!playlistInfiniteQuery.error) return;

    // const { error } = playlistInfiniteQuery;

    // if (
    //   error.code !== ErrorCodes.ERROR_TOKEN_EXPIRED.code &&
    //   error.code !== ErrorCodes.ERROR_GETTING_CODE.code
    // ) {
    //   toast({
    //     title: playlistInfiniteQuery.error.message ?? 'Unknown error',
    //     preset: 'error',
    //   });
    // }
  }, [playlistInfiniteQuery.error]);

  React.useEffect(() => {
    const items =
      playlistInfiniteQuery.data?.pages.flatMap((p) => p.items) ?? [];

    setPlaylists(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistInfiniteQuery.data?.pages]);

  return (
    <YStack bg="$bgApp" height="100%">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <ActionIcon
              onlyIcon
              color="black"
              icon={<RefreshCcw size="$1" />}
              variant="icon"
              onPress={() => {
                playlistInfiniteQuery.refetch();
              }}
            />
          ),
        }}
      />

      <Text color="$gray10" fontSize="$textMd">
        Tap on a playlist to start analyzing the lyrics
      </Text>

      <Separator my="$8" />

      <AlertDialog
        content={<PlaylistAnalyzePop text={stepTextAnalysis} />}
        open={syncingPlaylist}
        title="Syncing Playlist"
        onOpenChange={(v) => !v && setPlaylistPopOver(null)}
      >
        <ConfirmModal
          closeText="Close"
          confirmText="Sync"
          content={
            <Text color="$gray10" fontSize="$textMd">
              Sync process will start and will take some time. This will
              generate keywords and insights for each lyric's song.
            </Text>
          }
          open={!!playlistPopOver}
          title="Sync Playlist"
          onClose={() => setPlaylistPopOver(null)}
          onConfirm={() => {
            vibration('light');
            setSyncingPlaylist(true);
            if (!playlistPopOver) return;

            analyzeSongsMutation.mutate({
              url: playlistPopOver.tracks.href,
              songsStored: songsLyrics,
              isLimitEnabled,
              putSongLyrics,
              setStepTextAnalysis,
            });
          }}
          onOpenChange={(v) => !v && setPlaylistPopOver(null)}
        >
          <VirtualizedList
            items={playlists}
            loading={playlistInfiniteQuery.isLoading}
            loadingText="Loading playlists"
            // add onEndReached to fetch more data
            renderItem={({ item, index }) => (
              <PlaylistCard
                data={item}
                key={`playlist-${index}`}
                onPress={() => {
                  setPlaylistPopOver(item);
                }}
              />
            )}
          />
        </ConfirmModal>
      </AlertDialog>
    </YStack>
  );

  function parseOffset(next?: string | null) {
    if (!next) return undefined;

    const url = new URL(next);

    const offset = url.searchParams.get('offset');
    const limit = url.searchParams.get('limit');

    return {
      offset: parseInt(offset || '50', 10),
      limit: parseInt(limit || '50', 10),
    };
  }
};

export default Playlist;
