import { SizableText, Text, ToggleGroup, View, XStack } from 'tamagui';

import React, { useState } from 'react';

import { Search, X } from '@tamagui/lucide-icons';

import ActionIcon from './action-icon';
import InputText from './input-text';
import Loader from './loader';

import type { TabLayout } from 'tamagui';

export type TabType = {
  value: string;
  title: string;
  content: React.ReactNode;
};

type TabsAdvancedProps = {
  name?: string;
  tabs: Array<TabType>;
  query?: string;
  loadingSearch?: boolean;
  searchableTabs?: Array<string> | 'all';
  onQueryChange?: (query: string) => void;
};

type TabState = {
  currentTab: string;
  intentAt?: TabLayout | null;
  activeAt?: TabLayout | null;
  prevActiveAt?: TabLayout | null;
};

const TabsGroup = (props: TabsAdvancedProps) => {
  const { tabs, query, searchableTabs, loadingSearch } = props;

  const [searching, setSearching] = useState(false);

  const [tabState, setTabState] = useState<TabState>({
    currentTab: tabs[0].value,
  });

  const isSearchable =
    searchableTabs === 'all'
      ? true
      : searchableTabs?.includes(tabState.currentTab);

  const contentTab = tabs.find(
    (tab) => tab.value === tabState.currentTab
  )?.content;

  return (
    <React.Fragment>
      <XStack
        content="center"
        items="center"
        justify="space-between"
        width="100%"
      >
        {!searching && (
          <ToggleGroup
            disableDeactivation
            bg="$cardBg"
            orientation="horizontal"
            px="$2"
            size="$2"
            type="single"
            value={tabState.currentTab}
            onValueChange={(value) => {
              setTabState({ ...tabState, currentTab: value });
            }}
          >
            {tabs.map((tab, index) => (
              <ToggleGroup.Item
                bg={tabState.currentTab === tab.value ? '$gray5' : '$cardBg'}
                flexGrow={1}
                key={index}
                px="$2.5"
                py="$1"
                value={tab.value}
                onPress={() =>
                  setTabState({ ...tabState, currentTab: tab.value })
                }
              >
                <SizableText>{tab.title}</SizableText>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        )}

        {isSearchable && searching && (
          <View grow={1} width="100%">
            <InputText
              placeholder="Search"
              value={query}
              onChange={(value) => props.onQueryChange?.(String(value))}
            />
          </View>
        )}

        {isSearchable && !loadingSearch && (
          <ActionIcon
            onlyIcon
            icon={
              searching ? (
                <X color="$gray11" size={18} />
              ) : (
                <Search color="$gray11" size={18} />
              )
            }
            variant="icon"
            onPress={() => setSearching((prev) => !prev)}
          />
        )}

        {isSearchable && loadingSearch && (
          <Loader color="$gray10" size="small" />
        )}
      </XStack>

      {contentTab || <Text>Tab content not found</Text>}
    </React.Fragment>
  );
};

export default TabsGroup;
