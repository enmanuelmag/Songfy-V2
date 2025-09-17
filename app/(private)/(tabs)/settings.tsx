import moment from 'moment';
import { Card, Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Image } from 'expo-image';
import { router } from 'expo-router';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import ButtonCustom from '@components/shared/button';
import ConfirmModal from '@components/shared/confirm-modal';
import SwitchWithLabel from '@components/shared/switch-custom';
import QKeys from '@constants/react-api';
import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';
import { LogOut, Music } from '@tamagui/lucide-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';
import { toast } from '@utils/notifications';

// import SpotifyLogo from '@assets/icons/spotify-logo.svg';

const Settings = () => {
  const {
    user,
    tokenSentAt,
    isLimitEnabled,
    songsLyrics,
    setTokenSentAt,
    setLimitEnabled,
    setTokenExpired,
    clearSongsLyrics,
    theme,
    setTheme,
    clear,
  } = useAppStore();

  const [loadingSpotify, setLoadingSpotify] = React.useState(false);

  const [confirmClear, setConfirmClear] = React.useState(false);

  const spotifyCheckTokenQuery = useQuery<
    boolean,
    Error,
    boolean,
    [string, number | undefined]
  >({
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryKey: [QKeys.CHECK_SPOTIFY_TOKEN_KEY, tokenSentAt],
    queryFn: async ({ queryKey }) => {
      const result = await DataRepo.spotifyService.checkToken(queryKey[1]);

      if (!result) {
        setTokenExpired(true);
      }

      return result;
    },
  });

  const spotifyAuthorizeMutation = useMutation({
    retry: false,
    mutationFn: async () => DataRepo.spotifyService.authorize(),
    onSettled: (_, error) => {
      if (error) {
        toast({
          title: error.message || 'Error connecting to Spotify',
          preset: 'error',
        });
      } else {
        toast({
          title: 'Spotify connected',
          preset: 'done',
        });
        setTokenSentAt(moment().unix());
      }
      setLoadingSpotify(false);
    },
  });

  const songsSizeQuery = useQuery<number, Error, number>({
    queryKey: [QKeys.GET_SONGS_SIZE_KEY, Object.keys(songsLyrics)],
    queryFn: () => {
      if (!Object.keys(songsLyrics).length) return 0;

      const { size } = new Blob([JSON.stringify(songsLyrics)], {
        type: 'application/json',
      });

      return Math.max(size / 1024 / 1024, 0.01);
    },
  });

  const isLoadingSize = isLoadingRefetchQuery(songsSizeQuery);

  return (
    <YStack bg="$bgApp" height="100%">
      <YStack gap="$4" px="$1">
        <Text color="$gray11" fontSize="$textLg">
          Welcome{' '}
          <Text
            className="prose cd-font-semibold"
            color="$gray11"
            fontSize="$textLg"
            fontWeight={600}
          >
            {user?.displayName ?? user?.email}!
          </Text>
        </Text>

        <SwitchWithLabel
          fullWidth
          label="Dark mode"
          name="darkMode"
          value={theme === 'dark'}
          onChange={(value) => {
            vibration('light');
            setTheme(value ? 'dark' : 'light');
          }}
        />

        <Separator />

        <Card bordered className="cd-bg-white dark:cd-bg-zinc-900">
          <Card.Header>
            <XStack gap="$2" items="center" justify="space-between">
              <XStack gap="$4" items="center">
                {/* <SpotifyLogo height={42} width={42} /> */}
                <Image
                  source={{
                    uri: require('@assets/icons/spotify-logo.png'),
                    width: 42,
                    height: 42,
                  }}
                  style={{ borderRadius: 8, aspectRatio: 1, height: 42 }}
                />

                <YStack gap="$0.5">
                  <Text color="$gray11" fontSize="$textMd">
                    Spotify
                  </Text>
                  <Text color="$gray11" fontSize="$textSm">
                    {!spotifyCheckTokenQuery.data && 'No token found'}
                    {spotifyCheckTokenQuery.data &&
                      tokenSentAt &&
                      `Token expires in ${moment.unix(tokenSentAt).add(1, 'hour').fromNow(true)}`}
                  </Text>
                </YStack>
              </XStack>

              <ButtonCustom
                color={spotifyCheckTokenQuery.data ? 'red' : 'green'}
                loading={loadingSpotify}
                text={spotifyCheckTokenQuery.data ? 'Disconnect' : 'Connect'}
                variant="transparent"
                onPress={() => {
                  vibration('light');
                  setLoadingSpotify(true);

                  if (!spotifyCheckTokenQuery.data) {
                    spotifyAuthorizeMutation.mutate();
                  } else {
                    DataRepo.spotifyService.logout().finally(() => {
                      setTokenSentAt();
                      setLoadingSpotify(false);
                    });
                  }
                }}
              />
            </XStack>
          </Card.Header>
        </Card>

        <Separator />

        <Card bordered bg="$cardBg" borderRadius="$3">
          <Card.Header>
            <XStack gap="$2" items="center" justify="space-between">
              <XStack gap="$4" items="center">
                <View mx="$3">
                  <Music size="$2" />
                </View>

                <YStack gap="$0.5">
                  <Text color="$gray11" fontSize="$textMd">
                    Songs Lyrics
                  </Text>
                  <Text color="$gray11" fontSize="$textSm">
                    {isLoadingSize
                      ? 'Calculating...'
                      : `${songsSizeQuery.data?.toFixed(2)} MB`}
                  </Text>
                </YStack>
              </XStack>

              <ConfirmModal
                closeText="Cancel"
                confirmColor="red"
                confirmText="Clear"
                content={
                  <Text color="$gray10" fontSize="$textMd">
                    Are you sure you want to clear all songs lyrics and
                    insights?
                  </Text>
                }
                open={confirmClear}
                title="Clear Songs Lyrics"
                onClose={() => setConfirmClear(false)}
                onConfirm={() => clearSongsLyrics()}
                onOpenChange={(v) => !v && setConfirmClear(false)}
              >
                <ButtonCustom
                  color="red"
                  disabled={
                    isLoadingSize || Object.keys(songsLyrics).length === 0
                  }
                  text="Clear"
                  variant="transparent"
                  onPress={() => setConfirmClear(true)}
                />
              </ConfirmModal>
            </XStack>
          </Card.Header>
        </Card>
      </YStack>
      <YStack gap="$3" justify="flex-end">
        <SwitchWithLabel
          fullWidth
          label="Limit mode"
          name="limitMode"
          value={Boolean(isLimitEnabled)}
          onChange={(value) => {
            vibration('light');
            setLimitEnabled(value);
          }}
        />

        <ButtonCustom
          color="red"
          iconLeft={<LogOut size="$1" />}
          text="Logout"
          variant="outline"
          onPress={() => {
            vibration('light');
            DataRepo.userService.logout().finally(() => {
              router.replace(Routes.LOGIN);
              queryClient.clear();
              clear();
            });
          }}
        />
      </YStack>
    </YStack>
  );
};

export default Settings;
