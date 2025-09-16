import * as Burnt from 'burnt';
import moment from 'moment';
import {
  Accordion,
  Progress,
  Separator,
  Square,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';

import React from 'react';

import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import Event from '@components/budget/event';
import LinePlotCustom from '@components/budget/line-plot';
import MonthSchedule from '@components/budget/month-schedule';
import Bulk from '@components/budget/pop-bulk';
import DeleteContent from '@components/budget/pop-delete-event';
import DetailContent from '@components/budget/pop-detail-event';
import MonthlyEvent from '@components/budget/pop-monthly-event';
import ActionIcon from '@components/shared/action-icon';
import BottomSheetModal from '@components/shared/bottom-sheet';
import Chip from '@components/shared/chip';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import GradientList from '@components/shared/gradient-list';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import TabsAdvanced from '@components/shared/tabs';
import VirtualizedList from '@components/shared/virtualized-list';
import {
  DELETE_EVENT_KEY,
  GET_BUDGET_KEY,
  GET_SCHEDULE_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useDebounceState } from '@hooks/input';
import { useListState } from '@hooks/list';
import BudgetScheduler from '@model/Budget';
import { useAppStore } from '@store/index';
import { ChevronDown, Edit3, HelpCircle, X } from '@tamagui/lucide-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEventPeriod } from '@utils/budget';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';
import { navigate } from '@utils/router';
import { formatCurrency } from '@utils/string';
import { getLiquidBorderColor } from '@utils/styles';

import type { TabType } from '@components/shared/tabs';
import type {
  BudgetExtendedType,
  BuildBudgetBuilderType,
  CategoryAmountType,
  EventBaseType,
  EventBudgetType,
} from '@customTypes/budget';
import type { ScrollView } from 'react-native';

const BudgetView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [listBulk, handlers] = useListState<EventBudgetType>([]);

  const { theme } = useAppStore();

  // const [bulkView, setBulkView] = React.useState<boolean>(false);

  const refScroll = React.useRef<ScrollView>(null);

  const [currentDate] = React.useState<number>(moment().unix());

  const [detailPopOver, setDetailPopOver] =
    React.useState<EventBaseType | null>();

  const [deletePopOver, setDeletePopOver] =
    React.useState<EventBaseType | null>();

  const [bulkPopOver, setBulkPopOver] =
    React.useState<Array<EventBudgetType> | null>();

  const [monthlyEventPopOver, setMonthlyEventPopOver] =
    React.useState<EventBudgetType | null>();

  const [query, debouncedQuery, setQuery, debouncing] =
    useDebounceState<string>('', 1000);

  const budgetQuery = useQuery<BudgetExtendedType, Error>({
    enabled: !!id,
    queryKey: [GET_BUDGET_KEY, id],
    queryFn: async () => {
      setDetailPopOver(null);
      setDeletePopOver(null);
      const budget = await DataRepo.budgetsService.getBudget(String(id));
      return budget;
    },
  });

  const scheduleQuery = useQuery<BuildBudgetBuilderType, Error>({
    enabled: !!budgetQuery.data?.id,
    queryKey: [GET_SCHEDULE_KEY, id, budgetQuery.data],
    queryFn: () => {
      const schedule = new BudgetScheduler(
        budgetQuery.data as BudgetExtendedType
      ).build();
      return schedule;
    },
  });

  const deleteEvent = useMutation<boolean, Error, string>({
    mutationKey: [DELETE_EVENT_KEY],
    mutationFn: async (eventId: string) => {
      const response = await DataRepo.budgetsService.deleteEvent(
        String(id),
        eventId
      );

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (q) =>
          [GET_SCHEDULE_KEY, GET_BUDGET_KEY].includes(q.queryKey[0] as string),
      });

      return response;
    },
    onSettled: (_, error) => {
      if (error) {
        Burnt.toast({
          title: 'Error deleting event',
          preset: 'error',
        });
      } else {
        Burnt.toast({
          preset: 'done',
          title: 'Event deleted',
        });
        setDeletePopOver(null);
      }
    },
  });

  const { budget, schedule } = {
    budget: budgetQuery.data,
    schedule: scheduleQuery.data,
  };

  const tabsMemo = React.useMemo(() => {
    if (!schedule?.monthsScheduleLinePlot.labels.length || !budget) {
      return [];
    }

    const tabs: Array<TabType> = [
      {
        value: 'schedule',
        title: 'Schedule',
        content: buildSchedule(schedule, budget.id),
      },
      {
        value: 'category-grouped',
        title: 'Category',
        content: buildCategory(schedule.categoriesAmountGroup),
      },
      {
        value: 'active-event',
        title: 'Active',
        content: buildEvents(budget.events),
      },
      {
        value: 'inactive-events',
        title: 'Inactive',
        content: buildEvents(budget.eventsArchived),
      },
    ];

    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    budget,
    listBulk,
    debouncedQuery,
    schedule?.monthsSchedule,
    schedule?.monthsScheduleLinePlot,
  ]);

  const isLoading = isLoadingRefetchQuery(budgetQuery, scheduleQuery);

  const liquidBorderColor = getLiquidBorderColor();

  if (isLoading) {
    return (
      <YStack bg="$bgApp" height="100%" justify="center">
        <LoaderText text="Loading budget" />
      </YStack>
    );
  }

  return (
    <DismissKeyboardHOC>
      <React.Fragment>
        <GradientList ref={refScroll}>
          <YStack gap="$3" height="100%" p="$3">
            {budget && (
              <Stack.Screen
                options={{
                  headerTitle: () => (
                    <Text color="$primary" fontSize="$textLg">
                      Schedule
                    </Text>
                  ),
                  headerRight: () => (
                    <ActionIcon
                      onlyIcon
                      icon={<Edit3 color="$gray12" size={18} />}
                      variant="icon"
                      onPress={() => {
                        navigate({
                          to: Routes.BUDGET_EDIT,
                          params: { id: budget.id },
                        });
                      }}
                    />
                  ),
                }}
              />
            )}
            {budget && (
              <React.Fragment>
                <YStack gap="$1">
                  <Text
                    color="$gray12"
                    fontSize="$textXl"
                    fontWeight="bold"
                    mb="$2"
                  >
                    {budget.name}
                  </Text>
                  <Text color="$gray11" fontSize="$textMd">
                    {budget.description}
                  </Text>
                  <XStack
                    content="flex-start"
                    items="flex-start"
                    justify="space-between"
                  >
                    <Text color="$gray11" fontSize="$textMd">
                      Initial balance {formatCurrency(budget.initialBalance)}
                    </Text>
                    <HelperPopover />
                  </XStack>
                </YStack>

                <Separator />

                <BottomSheetModal
                  content={
                    <YStack>
                      {detailPopOver && <DetailContent data={detailPopOver} />}
                      {deletePopOver && (
                        <DeleteContent
                          data={deletePopOver}
                          setPopOver={setDeletePopOver}
                          onDeleted={() => deleteEvent.mutate(deletePopOver.id)}
                        />
                      )}
                      {monthlyEventPopOver && (
                        <MonthlyEvent
                          budgetId={budget.id}
                          currentDate={currentDate}
                          data={monthlyEventPopOver}
                          setMonthlyEventPopOver={(v) =>
                            setMonthlyEventPopOver(v)
                          }
                        />
                      )}
                      {bulkPopOver && (
                        <Bulk
                          budgetId={budget.id}
                          currentDate={currentDate}
                          data={bulkPopOver}
                          onCancel={() => {
                            setBulkPopOver(null);
                          }}
                          onDone={() => {
                            setBulkPopOver(null);
                            handlers.clear();
                          }}
                        />
                      )}
                    </YStack>
                  }
                  open={Boolean(
                    detailPopOver ||
                      deletePopOver ||
                      monthlyEventPopOver ||
                      bulkPopOver
                  )}
                  onOpenChange={(v) => {
                    if (!v) {
                      detailPopOver && setDetailPopOver(null);
                      deletePopOver && setDeletePopOver(null);
                      monthlyEventPopOver && setMonthlyEventPopOver(null);
                      bulkPopOver && setBulkPopOver(null);
                    }
                  }}
                >
                  <TabsAdvanced
                    loadingSearch={debouncing}
                    query={query}
                    refScroll={refScroll}
                    searchableTabs="all"
                    tabs={tabsMemo}
                    onQueryChange={setQuery}
                  />
                </BottomSheetModal>
              </React.Fragment>
            )}
          </YStack>
        </GradientList>

        {Boolean(listBulk.length) && (
          <XStack
            b="$4"
            flex={1}
            items="center"
            justify="center"
            pb="$3"
            position="absolute"
            px="$3"
            width="100%"
          >
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={22}
              style={{
                height: 45,
                width: '100%',
                borderRadius: 50,
                overflow: 'hidden',
                borderTopColor: liquidBorderColor,
                borderTopWidth: 1,
                borderBottomColor: liquidBorderColor,
                borderBottomWidth: 1,
                borderLeftColor: liquidBorderColor,
                borderLeftWidth: 1,
                borderRightColor: liquidBorderColor,
                borderRightWidth: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: 'row',
                paddingHorizontal: 16,
              }}
              tint={theme === 'dark' ? 'dark' : 'extraLight'}
            >
              <Text color="$gray12" fontSize="$textMd">
                {listBulk.length} selected events
              </Text>
              <View my="$-1">
                <ActionIcon
                  onlyIcon
                  icon={<X color="white" size={22} />}
                  variant="icon"
                  onPress={() => {
                    vibration();
                    handlers.clear();
                  }}
                />
              </View>
            </BlurView>
            {/* <XStack
              // bg="$primary"
              grow={1}
              items="center"
              justify="center"
              px="$3"
              py="$3"
              rounded="$3"
              onPress={() => {
                vibration();
                setBulkPopOver(listBulk);
              }}
            >
              
            </XStack> */}
          </XStack>
        )}
      </React.Fragment>
    </DismissKeyboardHOC>
  );

  function buildSchedule(
    scheduleData: BuildBudgetBuilderType,
    budgetId: string
  ) {
    let rawItems = scheduleData.monthsSchedule;

    if (debouncedQuery.length) {
      rawItems = scheduleData.monthsSchedule.filter(({ date }) =>
        moment
          .unix(date)
          .format('MMMM YYYY')
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase())
      );
    }

    const items = [
      ...rawItems.map((month, idx) => {
        return (
          <MonthSchedule
            budgetId={budgetId}
            data={month}
            handlers={handlers}
            isFutureMonth={
              moment
                .unix(month.date)
                .endOf('month')
                .endOf('day')
                .diff(
                  moment.unix(currentDate).startOf('month').startOf('day'),
                  'days'
                ) > 0
            }
            key={`month-${idx}`}
            listBulk={listBulk}
            setMonthlyEvent={setMonthlyEventPopOver}
            showPercentage={Boolean(idx)}
          />
        );
      }),
      <View key="line-plot" onPress={() => {}}>
        <Separator key="separator" my="$4" />
        <LinePlotCustom
          data={scheduleData.monthsScheduleLinePlot}
          key="line-plot-schedule"
        />
      </View>,
    ];

    return items.map((item, index) => (
      <View key={index} mb={index === items.length - 1 ? '$20' : '$2'}>
        {item}
      </View>
    ));
  }

  function buildEvents(items: Array<EventBaseType>) {
    if (!items.length) {
      return (
        <YStack height="100%" justify="flex-start">
          <Text color="$gray11" fontSize="$textMd" mt="$3" text="center">
            No events yet
          </Text>
        </YStack>
      );
    }

    if (debouncedQuery.length) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    return (
      <VirtualizedList
        initialNumToRender={4}
        items={items}
        renderItem={({ item: event, index }) => (
          <View
            mb={index === items.length - 1 ? '$20' : '$2'}
            onPress={() => null}
          >
            <Event
              data={event}
              onDelete={() => {
                setDeletePopOver(event);
              }}
              onPress={() => setDetailPopOver(event)}
            />
          </View>
        )}
      />
    );
  }

  function buildCategory(categoriesGroup: Array<CategoryAmountType>) {
    if (debouncedQuery.length) {
      categoriesGroup = categoriesGroup.filter((category) =>
        category.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    const items = categoriesGroup.map((category, idx) => (
      <Accordion.Item
        bg="$bgApp"
        borderWidth={0}
        key={`category-${idx}`}
        rounded="$3"
        value={`category-${idx}`}
        onPress={() => {}}
      >
        <Accordion.Trigger
          bg="$bgApp"
          borderLeftWidth={0}
          borderRightWidth={0}
          flexDirection="row"
          justify="space-between"
          px="$3"
        >
          {({ open }: { open: boolean }) => (
            <XStack justify="space-between" width="100%">
              <Chip color={category.color}>{category.name}</Chip>
              <XStack content="center" gap="$4" items="center">
                <Text color="$gray12" fontSize="$textMd">
                  {formatCurrency(category.amountMonthly, {
                    precision: 0,
                  })}
                  /month
                </Text>
                <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                  <ChevronDown size="$1" />
                </Square>
              </XStack>
            </XStack>
          )}
        </Accordion.Trigger>
        <Accordion.HeightAnimator animation="quick">
          <Accordion.Content
            animation="quick"
            bg="$bgApp"
            exitStyle={{ opacity: 0 }}
          >
            <YStack gap="$2">
              <YStack rowGap="$1.5">
                {category.events.map((event, index) => (
                  <XStack
                    borderBottomColor="$borderColor"
                    justify="space-between"
                    key={index}
                    width="100%"
                  >
                    <Text
                      color="$gray12"
                      fontSize="$textSm"
                      onPress={() => setDetailPopOver(event)}
                    >
                      {event.name}{' '}
                      <Text color="$gray10" fontSize="$textXs">
                        {getEventPeriod(event)}
                      </Text>
                    </Text>
                    <Text
                      color={event.type === 'expense' ? '$red10' : '$green10'}
                    >
                      {formatCurrency(event.amount)}
                    </Text>
                  </XStack>
                ))}
              </YStack>

              <Separator my="$2" />

              <YStack rowGap="$1.5">
                <XStack justify="space-between" width="100%">
                  <Text color="$gray12" fontSize="$textSm">
                    Monthly
                  </Text>
                  <Text color="$gray12" fontSize="$textSm">
                    {formatCurrency(category.amountMonthly)}
                  </Text>
                </XStack>
                <XStack justify="space-between" width="100%">
                  <Text color="$gray12" fontSize="$textSm">
                    Yearly
                  </Text>
                  <Text color="$gray12" fontSize="$textSm">
                    {formatCurrency(category.amountYearly)}
                  </Text>
                </XStack>
              </YStack>

              {Boolean(category.maxAmount) && (
                <React.Fragment>
                  <Separator my="$2" />

                  <YStack rowGap="$1.5">
                    <XStack items="center" justify="space-between" width="100%">
                      <Text color="$gray12" fontSize="$textSm">
                        Max amount
                        <Text color="$gray10" fontSize="$textXs">
                          {' '}
                          (yearly)
                        </Text>
                      </Text>
                      <Text color="$gray12" fontSize="$textSm">
                        {formatCurrency(category.maxAmount)}
                      </Text>
                    </XStack>
                    <XStack items="center" justify="space-between" width="100%">
                      <Text color="$gray12" fontSize="$textSm">
                        Balance used
                      </Text>
                      <Text color="$gray12" fontSize="$textSm">
                        {formatCurrency(category.amountYearly)}
                      </Text>
                    </XStack>
                    <XStack items="center" justify="space-between" width="100%">
                      <Text color="$gray12" fontSize="$textSm">
                        Remaining
                      </Text>
                      <Text color="$gray12" fontSize="$textSm">
                        {formatCurrency(
                          category.maxAmount - category.amountYearly
                        )}
                      </Text>
                    </XStack>
                    <Progress
                      bg="$gray7"
                      mt="$2"
                      value={Math.min(
                        (category.amountYearly / category.maxAmount) * 100,
                        100
                      )}
                    >
                      <Progress.Indicator
                        animation="bouncy"
                        bg={getBalanceColor(
                          category.amountYearly,
                          category.maxAmount
                        )}
                      />
                    </Progress>
                  </YStack>
                </React.Fragment>
              )}
            </YStack>
          </Accordion.Content>
        </Accordion.HeightAnimator>
      </Accordion.Item>
    ));

    return (
      <GradientList>
        <View minH={items.length * 70}>
          <Accordion
            borderWidth={0}
            mt="$0.5"
            overflow="hidden"
            rounded="$3"
            type="multiple"
            width="100%"
          >
            {items}
          </Accordion>
          <View height="$6" />
        </View>
      </GradientList>
    );
  }

  function getBalanceColor(balance: number, maxAmount: number) {
    const percentage = (balance / maxAmount) * 100;

    if (percentage > 100) {
      return '$red10';
    }
    if (percentage > 75) {
      return '$yellow10';
    }
    return '$green10';
  }
};

function HelperPopover() {
  const [tabs] = React.useState<Array<TabType>>([
    {
      title: 'Schedule',
      value: 'schedule',
      content: (
        <React.Fragment>
          <Text color="$gray10" fontSize="$textMd">
            This tab show each month of the budget. In each card you can see two
            sections:
          </Text>
          <YStack gap="$2" p="$2">
            <Text color="$gray10" fontSize="$textMd">
              <Text color="$gray11" fontSize="$textMd" fontWeight="500">
                Timeline
              </Text>
              : here you can see all the events of the month. If the event is
              dismissed, it means that already happened. If not you will see the
              date and below the calculated balance in that moment
            </Text>
            <Text color="$gray10" fontSize="$textMd">
              <Text color="$gray11" fontSize="$textMd" fontWeight="500">
                Balance
              </Text>
              : here you can see the balance of the month. If the expenses are
              higher than the income of the month, it will show in yellow. If
              the expenses are higher than the balance of the month, it will
              show in red. It means that you are spending more than you have.
            </Text>
          </YStack>
          <Text color="$gray10" fontSize="$textMd">
            Also at the end of the tab you can see a line plot with the balance
            of each month. This plot is only calculated for the 10 first months.
          </Text>
        </React.Fragment>
      ),
    },
    {
      title: 'Category',
      value: 'category-grouped',
      content: (
        <React.Fragment>
          <Text color="$gray10" fontSize="$textMd">
            This tab shows the summation of the events by category.
          </Text>

          <Text color="$gray10" fontSize="$textMd">
            If you tap on the category, you will see the events that are in that
            category. Also you can see a total monthly and yearly sum of the
            category.
          </Text>

          <Text color="$gray10" fontSize="$textMd">
            Tapping on the event name, you will see a pop over with the details
            of the event.
          </Text>
        </React.Fragment>
      ),
    },
    {
      title: 'Active',
      value: 'active',
      content: (
        <React.Fragment>
          <Text color="$gray10" fontSize="$textMd">
            This tab shows all the active events of the budget, it meas the
            event that are not already happened or still in progress, in the
            case that is periodic and the end date is not reached.
          </Text>
          <Text color="$gray10" fontSize="$textMd">
            If you tap in the event, you will see a pop over with the details of
            the event. Also you can delete the event.
          </Text>
        </React.Fragment>
      ),
    },
    {
      title: 'Inactive',
      value: 'inactive',
      content: (
        <React.Fragment>
          <Text color="$gray10" fontSize="$textMd">
            This tab shows all the inactive events of the budget, it meas the
            event that are already happened or the end date is reached.
          </Text>
          <Text color="$gray10" fontSize="$textMd">
            If you tap in the event, you will see a pop over with the details of
            the event. Also you can delete the event.
          </Text>
        </React.Fragment>
      ),
    },
  ]);
  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          <YStack pb="$5" rowGap="$1">
            <Text color="$gray12" fontSize="$textXl" fontWeight="600">
              What are in this section?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              Here you can see the calculated balance for each month of the
              event that you have created. You have three tabs:
            </Text>

            <TabsAdvanced tabs={tabs} />
          </YStack>
        </GradientList>
      }
    >
      <HelpCircle color="$gray12" size="$1.5" />
    </PopOver>
  );
}

export default BudgetView;
