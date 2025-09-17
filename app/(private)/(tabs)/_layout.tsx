import { Separator, Text, View, YStack } from 'tamagui';

import React from 'react';

import { Settings } from 'react-native';

import { Tabs } from 'expo-router';

import DataRepo from '@api/datasource';
import ActionIcon from '@components/shared/action-icon';
import BottomSheetModal from '@components/shared/bottom-sheet';
import GradientList from '@components/shared/gradient-list';
import Logo from '@components/shared/logo';
import { useTabsScreenOptions } from '@config/screens';
import QKeys from '@constants/react-api';
import { HelpCircle, ListMusic, Music, Search } from '@tamagui/lucide-icons';
import { useQuery } from '@tanstack/react-query';
import { vibration } from '@utils/haptics';
import { isAndroid, isIPad } from '@utils/platform';

import type { BudgetBaseType, CategoryType } from '@customTypes/budget';
import type { ChargeType } from '@customTypes/charges';

type PopOverSelected = 'playlist' | 'search' | 'songs' | null;

export default function TabLayout() {
  const [popOverType, setPopOverType] = React.useState<PopOverSelected>(null);

  const searchTabConfig = useTabsScreenOptions({
    title: 'Search',
    headerTitle: <Logo colored="fy" normal="Search" />,
    Icon: Search,
    headerRight: (
      <ActionIcon
        onlyIcon
        color="black"
        icon={<HelpCircle size="$1.5" />}
        variant="icon"
        onPress={() => setPopOverType('search')}
      />
    ),
  });

  const playlistsTabConfig = useTabsScreenOptions({
    title: 'Playlists',
    headerTitle: <Logo colored="lists" normal="Play" />,
    Icon: ListMusic,
    headerRight: (
      <ActionIcon
        onlyIcon
        color="black"
        icon={<HelpCircle size="$1.5" />}
        variant="icon"
        onPress={() => setPopOverType('playlist')}
      />
    ),
  });

  const songsTabConfig = useTabsScreenOptions({
    title: 'Songs',
    headerTitle: <Logo colored="gs" normal="Son" />,
    Icon: Music,
    headerRight: (
      <ActionIcon
        onlyIcon
        color="black"
        icon={<HelpCircle size="$1.5" />}
        variant="icon"
        onPress={() => setPopOverType('songs')}
      />
    ),
  });

  const settingsTabConfig = useTabsScreenOptions({
    title: 'Settings',
    headerTitle: <Logo colored="ings" normal="Sett" />,
    Icon: Settings,
  });

  useQuery<Array<BudgetBaseType>, Error>({
    networkMode: 'always',
    queryKey: [QKeys.LIST_BUDGET_KEY],
    queryFn: async () => await DataRepo.budgetsService.getBudgets(),
  });

  useQuery<Array<ChargeType>, Error>({
    queryKey: [QKeys.LIST_CHARGES_KEY],
    queryFn: async () => await DataRepo.chargesService.getCharges(),
  });

  useQuery<Array<CategoryType>, Error>({
    queryKey: [QKeys.LIST_CATEGORY_KEY],
    queryFn: async () => await DataRepo.categoriesService.getCategories(),
  });

  return (
    <BottomSheetModal
      content={
        <React.Fragment>
          {popOverType === 'search' && <SearchHelper />}
          {popOverType === 'songs' && <SongsHelper />}
          {popOverType === 'playlist' && <PlaylistHelper />}
        </React.Fragment>
      }
      open={!!popOverType}
      onOpenChange={(v) => !v && setPopOverType(null)}
    >
      <Tabs
        screenListeners={{
          tabPress: () => {
            vibration('light');

            // if (!e.target) return;
            // const [name] = e.target.split('-');
            // setTabSelected(name as RoutesType);
          },
        }}
        screenOptions={{
          tabBarShowLabel: true,
          headerStatusBarHeight: 0,
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#339AF0',
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            shadowColor: 'transparent',
            paddingTop: isAndroid ? 6 : 8,
            marginBottom: isAndroid ? 4 : isIPad ? 1 : 1,
            borderTopColor: 'transparent',
            // theme === 'dark' ? Colors.grayDark.gray5 : Colors.gray.gray7,
          },
        }}
      >
        <Tabs.Screen name="search" options={searchTabConfig} />
        <Tabs.Screen name="songs" options={songsTabConfig} />
        <Tabs.Screen name="playlists" options={playlistsTabConfig} />
        <Tabs.Screen name="settings" options={settingsTabConfig} />
      </Tabs>
    </BottomSheetModal>
  );
}

function SearchHelper() {
  return (
    <GradientList fromPopOver>
      <YStack gap="$2">
        <Text className="prose cd-text-xl cd-font-semibold cd-text-gray-800 dark:cd-text-gray-200">
          How to search songs?
        </Text>
        <Separator my="$4" />
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          You can search songs by typing the feeling you want to listen to or
          just keywords. The app will then find songs that match the keywords or
          prompt you with songs that have a similar description.
        </Text>
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          <Text className="cd-font-semibold cd-text-gray-700 dark:cd-text-gray-300">
            You don't need to remember the exact keywords or brief
          </Text>
          , we use AI to find similar songs to the keywords or brief you type.
        </Text>
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          <Text className="cd-font-semibold cd-text-gray-700 dark:cd-text-gray-300">
            You must return a list that contains the ID song that has the most
            similar keywords or brief of lyrics to the search.
          </Text>
          , also analyze the lyric with the target brief. The output format must
          be ONLY a list of string (ID songs).
        </Text>
        <View height={20} />
      </YStack>
    </GradientList>
  );
}

function SongsHelper() {
  return (
    <GradientList fromPopOver>
      <YStack gap="$2">
        <Text className="prose cd-text-xl cd-font-semibold cd-text-gray-800 dark:cd-text-gray-200">
          What has a song analysis?
        </Text>
        <Separator my="$4" />
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          When a song is analyzed, we extract{' '}
          <Text className="cd-font-semibold cd-text-gray-700 dark:cd-text-gray-300">
            keywords and a brief description
          </Text>{' '}
          of the song. This allows you to search songs by semantic similarity.
        </Text>
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          You can then search songs by typing the feeling you want to listen to
          or just keywords. And the app will find songs that match the keywords
          or prompt.
        </Text>
        <Text className="prose cd-text-base cd-text-gray-500 dark:cd-text-gray-400">
          <Text className="cd-font-semibold cd-text-gray-700 dark:cd-text-gray-300">
            You don't need to remember the exact keywords or brief
          </Text>
          , we use AI to find similar songs to the keywords or brief you type
        </Text>
        <View height={20} />
      </YStack>
    </GradientList>
  );
}

function PlaylistHelper() {
  return (
    <GradientList fromPopOver>
      <YStack gap="$2">
        <Text color="$gray12" fontSize="$text2Xl" fontWeight={600}>
          Why analyze playlists?
        </Text>
        <Separator my="$4" />
        <Text color="$gray11" fontSize="$textMd">
          Analyzing playlists allows you to search songs by semantic similarity.
          This means that you can search typing the{' '}
          <Text color="$gray11" fontSize="$textMd" fontWeight={500}>
            feeling you want to listen to or just keywords
          </Text>
          .
        </Text>
        <Text color="$gray11" fontSize="$textMd">
          After analyzing a playlist, we add keywords to each song, and a brief
          description of the song. This way, the app then can find songs that
          match the keywords or prompt you with songs that have a similar
          description.
        </Text>
        <Text color="$gray11" fontSize="$textMd">
          <Text color="$gray11" fontSize="$textMd" fontWeight={500}>
            Take in mind that analyzing a playlist can take a while
          </Text>
          , depending on the number of songs in the playlist. After that is you
          modify your playlist , you should analyze it again to update the
          database
        </Text>
        <View height={20} />
      </YStack>
    </GradientList>
  );
}
