import { Controller, useForm } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { router } from 'expo-router';

import DataRepo from '@api/datasource';
import ActionIcon from '@components/shared/action-icon';
import ButtonCustom from '@components/shared/button';
import Chip from '@components/shared/chip';
import InputText from '@components/shared/input-text';
import VirtualizedList from '@components/shared/virtualized-list';
import SongListCard from '@components/song/song-list-card';
import { Routes } from '@constants/routes';
import { SearchSongLyricsFormSchema } from '@customTypes/spotify';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@store/index';
import { Search, X } from '@tamagui/lucide-icons';
import { useMutation } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingMutation } from '@utils/network';
import { toast } from '@utils/notifications';
import { capitalize } from '@utils/string';

import type {
  SearchSongLyricsFormType,
  SongLyricsType,
} from '@customTypes/spotify';

const SearchScreen = () => {
  const {
    songsLyrics,
    searchedSongs,
    searchBrief,
    searchKeywords,
    setSearchedSongs,
  } = useAppStore();

  const [keywordInput, setKeywordInput] = React.useState('');

  const searchForm = useForm<SearchSongLyricsFormType>({
    defaultValues: {
      brief: searchBrief,
      keywords: searchKeywords,
    },
    resolver: zodResolver(SearchSongLyricsFormSchema),
  });

  const searchMutation = useMutation<
    Array<SongLyricsType>,
    Error,
    SearchSongLyricsFormType
  >({
    retry: false,
    mutationFn: async ({ brief, keywords }) => {
      const songs = Object.values(songsLyrics);

      return await DataRepo.openAIService.searchSongs({
        keywords,
        brief,
        songs,
      });
    },
    onSettled: (data, error) => {
      if (error) {
        toast({
          title: error.message || 'Error searching songs',
          preset: 'error',
        });
      } else if (data) {
        setSearchedSongs(data);
      }
    },
  });

  const keywords = searchForm.getValues('keywords');

  const isLoadingSearch = isLoadingMutation(searchMutation);

  const isSearching = isLoadingMutation(searchMutation);

  return (
    <YStack bg="$bgApp" height="100%">
      <YStack gap="$3">
        <Controller
          control={searchForm.control}
          name="brief"
          render={({ field }) => (
            <InputText
              error={searchForm.formState.errors.brief?.message}
              placeholder="Brief description of the song"
              {...field}
            />
          )}
        />

        <YStack gap="$2">
          <XStack items="flex-start" mt="$2">
            <Controller
              control={searchForm.control}
              name="keywords"
              render={({ field }) => (
                <View flexDirection="row" width="100%">
                  <View flexBasis="80%" pr="$2">
                    <InputText
                      error={searchForm.formState.errors.keywords?.message}
                      placeholder="Add keywords to search"
                      value={keywordInput}
                      onChange={(value) => {
                        setKeywordInput(value as string);
                        searchForm.clearErrors('keywords');
                      }}
                    />
                  </View>
                  <View flexBasis="20%" pl="$2">
                    <ButtonCustom
                      color="violet"
                      disabled={
                        keywordInput.length < 3 ||
                        Boolean(searchForm.formState.errors.keywords?.message)
                      }
                      text="Add"
                      onPress={() => {
                        vibration('light');
                        field.onChange([...keywords, keywordInput]);
                        setKeywordInput('');
                      }}
                    />
                  </View>
                </View>
              )}
            />
          </XStack>
          <View className="cd-flex cd-flex-wrap cd-flex-row cd-w-full">
            {keywords.map((keyword, indx) => (
              <View key={indx} mx="$2" my="$2">
                <Chip
                  color="purple"
                  iconRight={
                    <ActionIcon
                      onlyIcon
                      color="black"
                      icon={<X size={16} />}
                      variant="icon"
                      onPress={() => {
                        vibration('light');

                        const filteredKeywords = searchForm
                          .getValues('keywords')
                          .filter((_, i) => i !== indx);

                        searchForm.setValue('keywords', filteredKeywords, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  }
                >
                  {capitalize(keyword)}
                </Chip>
              </View>
            ))}
          </View>
        </YStack>

        <ButtonCustom
          disabled={!isEmpty(searchForm.formState.errors)}
          iconLeft={<Search size={18} />}
          loading={isLoadingSearch}
          text="Search"
          onPress={() => {
            vibration('light');
            searchForm.handleSubmit((values) =>
              searchMutation.mutate(values)
            )();
          }}
        />
      </YStack>

      <Separator my="$4" />

      {!isSearching &&
        searchedSongs.length === 0 &&
        searchMutation.submittedAt > 0 && (
          <Text className="prose cd-text-base cd-text-gray-800 dark:cd-text-gray-100">
            No results found
          </Text>
        )}

      {!isSearching && searchedSongs.length > 0 && (
        <VirtualizedList
          items={searchedSongs}
          // add onEndReached to fetch more data
          renderItem={({ item, index }) => (
            <SongListCard
              data={item}
              key={`song-search-${index}`}
              onPress={() => {
                vibration('light');
                router.push(Routes.SONG.replace(':id', item.id));
              }}
            />
          )}
        />
      )}
    </YStack>
  );
};

export default SearchScreen;
