import {
  AnimatePresence,
  SizableText,
  Tabs,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';

import React, { useState } from 'react';

import {
  Dimensions,
  Keyboard,
  View as RView,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '@store/index';
import { Search, X } from '@tamagui/lucide-icons';
import { scrollToTarget } from '@utils/scroll';

import ActionIcon from './action-icon';
import InputText from './input-text';
import Loader from './loader';

import type { StackProps, TabLayout, TabsTabProps } from 'tamagui';

export type TabType = {
  value: string;
  title: string;
  content: React.ReactNode;
};

type TabsAdvancedProps = {
  tabs: Array<TabType>;
  query?: string;
  boldTitle?: boolean;
  fullWidth?: boolean;
  loadingSearch?: boolean;
  searchableTabs?: Array<string> | 'all';
  refScroll?: React.RefObject<ScrollView | null>;
  onTabChange?: (tab: string) => void;
  onQueryChange?: (query: string) => void;
};

type GradientType = {
  left: boolean;
  right: boolean;
};

type TabState = {
  currentTab: string;
  intentAt?: TabLayout | null;
  activeAt?: TabLayout | null;
  prevActiveAt?: TabLayout | null;
};

const { width } = Dimensions.get('screen');

const TabsAdvanced = React.forwardRef<any, TabsAdvancedProps>(
  (props: TabsAdvancedProps, ref) => {
    const {
      tabs,
      query,
      fullWidth,
      boldTitle,
      searchableTabs,
      onTabChange,
      loadingSearch,
      refScroll,
      onQueryChange,
    } = props;

    const { theme } = useAppStore();

    const inputRef = React.useRef<RView>(null);

    const [searching, setSearching] = useState(false);

    const [tabState, setTabState] = useState<TabState>({
      currentTab: tabs[0]?.value,
    });

    const [gradientType, setGradientType] = React.useState<GradientType>({
      left: false,
      right: false,
    });

    const { activeAt, intentAt } = tabState;

    const handleOnInteraction: TabsTabProps['onInteraction'] = (
      type,
      layout
    ) => {
      if (type === 'select') {
        setActiveIndicator(layout);
      } else {
        setIntentIndicator(layout);
      }
    };

    React.useEffect(() => {
      if (searching) {
        scrollToTarget(inputRef, refScroll);
      } else {
        Keyboard.dismiss();
      }
    }, [searching, refScroll]);

    const isSearchable =
      searchableTabs === 'all'
        ? true
        : searchableTabs?.includes(tabState.currentTab);

    const contentTab = tabs.find(
      (tab) => tab.value === tabState.currentTab
    )?.content;

    return (
      <React.Fragment>
        <Tabs
          activationMode="manual"
          flexDirection="column"
          orientation="horizontal"
          position="relative"
          ref={ref}
          rounded="$4"
          value={tabState.currentTab}
          onValueChange={(value) => {
            setTabState({ ...tabState, currentTab: value });
            onTabChange?.(value);
          }}
        >
          <YStack>
            <XStack
              content="center"
              items="center"
              justify="space-between"
              position="relative"
              py="$1.5"
              onPress={() => {
                if (searching && !Keyboard.isVisible()) return;
                Keyboard.dismiss();
              }}
            >
              {!searching && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  onScroll={(e) =>
                    setGradientType(
                      getScrollGradient(e.nativeEvent.contentOffset.x)
                    )
                  }
                >
                  <AnimatePresence
                    custom={{ animation: 'quick' }}
                    initial={false}
                  >
                    {intentAt && (
                      <TabsRovingIndicator
                        height={intentAt.height}
                        rounded="$4"
                        width={intentAt.width}
                        x={intentAt.x}
                        y={intentAt.y}
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence
                    custom={{ animation: 'quick' }}
                    initial={false}
                  >
                    {activeAt && (
                      <TabsRovingIndicator
                        active
                        animation="quick"
                        bg="$gray12"
                        height={activeAt.height}
                        rounded="$4"
                        width={activeAt.width}
                        x={activeAt.x}
                        y={activeAt.y}
                      />
                    )}
                  </AnimatePresence>
                  <XStack>
                    <Tabs.List disablePassBorderRadius gap="$1" loop={false}>
                      {tabs.map((tab, index) => (
                        <Tabs.Tab
                          unstyled
                          borderRadius="$4"
                          key={index}
                          px="$2.5"
                          py="$1"
                          style={{
                            backgroundColor: 'transparent',
                            width: fullWidth
                              ? (width - 28) / tabs.length
                              : 'auto',
                          }}
                          value={tab.value}
                          onInteraction={(type, layout) => {
                            handleOnInteraction(type, layout);
                          }}
                        >
                          <SizableText
                            color={
                              tabState.currentTab === tab.value
                                ? '$color3'
                                : '$gray12'
                            }
                            fontWeight={boldTitle ? '600' : undefined}
                            text="center"
                          >
                            {tab.title}
                          </SizableText>
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </XStack>
                </ScrollView>
              )}
              <AnimatePresence>
                {gradientType.left && (
                  <LinearGradient
                    colors={
                      getColor(theme === 'light' ? 255 : 0, 'left') as any
                    }
                    end={[1, 1]}
                    start={[0, 1]}
                    style={StyleGradient.left}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {gradientType.right && (
                  <LinearGradient
                    colors={
                      getColor(theme === 'light' ? 255 : 0, 'right') as any
                    }
                    end={[1, 1]}
                    start={[0, 1]}
                    style={StyleGradient.right}
                  />
                )}
              </AnimatePresence>
              {isSearchable && searching && (
                <RView
                  ref={inputRef}
                  style={{
                    flexGrow: 1,
                  }}
                >
                  <InputText
                    autoFocus={searching}
                    placeholder="Search"
                    value={query}
                    onChange={(value) => onQueryChange?.(String(value))}
                    onPress={() => scrollToTarget(inputRef, refScroll)}
                  />
                </RView>
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
                  onPress={() => {
                    setSearching((prev) => !prev);
                    props.onQueryChange?.('');
                  }}
                />
              )}
              {isSearchable && loadingSearch && (
                <View mx="$1">
                  <Loader color="$gray10" size="small" />
                </View>
              )}
            </XStack>
          </YStack>
        </Tabs>
        {contentTab || <Text>Tab content not found</Text>}
      </React.Fragment>
    );

    function getColor(value: number, dir: 'left' | 'right') {
      if (dir === 'left') {
        return [
          `rgba(${value}, ${value}, ${value}, ${value}.85)`,
          `rgba(${value}, ${value}, ${value}, 0)`,
        ];
      } else {
        return [
          `rgba(${value}, ${value}, ${value}, 0)`,
          `rgba(${value}, ${value}, ${value}, ${value}.85)`,
        ];
      }
    }

    function setIntentIndicator(value: TabLayout | null) {
      setTabState({ ...tabState, intentAt: value });
    }

    function setActiveIndicator(value: TabLayout | null) {
      setTabState({
        ...tabState,
        prevActiveAt: tabState.activeAt,
        activeAt: value,
      });
    }
  }
);

export default TabsAdvanced;

export const getScrollGradient = (xOffset: number) => {
  const result = {
    left: false,
    right: true,
  };

  if (xOffset > 0.05) {
    result.left = true;
  }
  if (xOffset > width * 0.85) {
    result.right = false;
  }

  return result;
};

const StyleGradient = StyleSheet.create({
  left: {
    position: 'absolute',
    width: 15,
    top: 0,
    left: 0,
    bottom: 0,
  },
  right: {
    position: 'absolute',
    width: 75,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

// const AnimatedYStack = styled(YStack, {
//   f: 1,
//   x: 0,
//   o: 1,
//   animation: null,
//   variants: {
//     // 1 = right, 0 = nowhere, -1 = left
//     direction: {
//       ':number': (direction) => ({
//         enterStyle: {
//           x: direction > 0 ? -25 : 25,
//           opacity: 0,
//         },
//         exitStyle: {
//           zIndex: 0,
//           x: direction < 0 ? -25 : 25,
//           opacity: 0,
//         },
//       }),
//     },
//   } as const,
// });

const TabsRovingIndicator = ({
  active,
  ...props
}: { active?: boolean } & StackProps) => {
  return (
    <YStack
      animation="quick"
      backgroundColor="$color5"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      opacity={0.7}
      position="absolute"
      {...(active && {
        backgroundColor: '$color10',
        opacity: 0.6,
      })}
      {...props}
    />
  );
};
