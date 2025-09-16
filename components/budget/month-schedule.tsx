import moment from 'moment';
import {
  Accordion,
  Card,
  Separator,
  Text,
  View,
  XStack,
  YStack,
} from 'tamagui';

import React from 'react';

import TabsGroup from '@components/shared/tabs-group';
import { GitCommitVertical } from '@tamagui/lucide-icons';
import {
  getColorIcon,
  getEventPeriod,
  isCompletedByDates,
} from '@utils/budget';
import { vibration } from '@utils/haptics';
import { formatCurrency } from '@utils/string';



import type { TabType } from '@components/shared/tabs-group';
import type { EventBudgetType, MonthlyBalanceType } from '@customTypes/budget';
import type { ListActions } from '@hooks/list';
import type { ColorTokens } from 'tamagui';

type MonthScheduleProps = {
  showPercentage: boolean;
  budgetId: string;
  isFutureMonth: boolean;
  data: MonthlyBalanceType;
  listBulk: Array<EventBudgetType>;
  handlers: ListActions<EventBudgetType>;
  setMonthlyEvent: (event: EventBudgetType) => void;
};

const MonthSchedule = (props: MonthScheduleProps) => {
  const { setMonthlyEvent, showPercentage, listBulk, isFutureMonth, handlers } =
    props;

  const { data } = props;

  const {
    date,
    budget: {
      flowBalance,
      available,
      expenses,
      incomes,
      globalBalance,
      monthlyBalance,
      relAvailable,
      relIncomes,
      relExpenses,
      relGlobalBalance,
      relMonthlyBalance,
    },
  } = data;

  const colorBalance = getColorBalance();

  return (
    <Card bordered bg="$cardBg" rounded="$2" onPress={() => {}}>
      <Card.Header px="$4" py="$2.5">
        <Text color="$gray12" fontSize="$textSm" fontWeight="600">
          {moment.unix(date).format('MMMM YYYY')}
        </Text>
      </Card.Header>
      <Card.Footer>
        <Accordion
          bg="$cardBg"
          borderBottomEndRadius="$2"
          borderBottomStartRadius="$2"
          borderWidth={0}
          overflow="hidden"
          type="multiple"
          width="100%"
        >
          <Accordion.Item
            bg="$cardBg"
            borderWidth={0}
            value={`timeline-${date}`}
            onPress={() => {}}
          >
            <Accordion.Trigger
              bg="$cardBg"
              borderLeftWidth={0}
              borderRightWidth={0}
              flexDirection="row"
              justify="space-between"
              py="$2.5"
            >
              <YStack gap="$1">
                <XStack justify="space-between">
                  <Text color="$gray11" fontSize="$textSm">
                    Incomes
                  </Text>
                  <Text color="$gray11" fontSize="$textSm">
                    {formatCurrency(incomes)}
                  </Text>
                </XStack>
                <XStack justify="space-between" width="100%">
                  <Text color="$gray11" fontSize="$textSm">
                    Expenses
                  </Text>
                  <Text color="$gray11" fontSize="$textSm">
                    {formatCurrency(expenses)}
                  </Text>
                </XStack>
              </YStack>
            </Accordion.Trigger>
            <Accordion.HeightAnimator animation="quick">
              <Accordion.Content
                animation="quick"
                bg="$cardBg"
                exitStyle={{ opacity: 0 }}
                pb="$2"
                pt="$3"
                px={0}
                width="100%"
              >
                <MonthDetail
                  data={flowBalance}
                  handlers={handlers}
                  listBulk={listBulk}
                  setMonthlyEvent={setMonthlyEvent}
                />
              </Accordion.Content>
            </Accordion.HeightAnimator>
          </Accordion.Item>
          <Accordion.Item
            bg="$cardBg"
            borderWidth={0}
            value={`balance-${date}`}
            width="100%"
            onPress={() => {}}
          >
            <Accordion.Trigger
              bg="$cardBg"
              borderLeftWidth={0}
              borderRightWidth={0}
              flexDirection="row"
              justify="space-between"
              px="$0"
              py="$2.5"
            >
              <YStack borderColor="$borderColor" gap="$1" pt="$1" px="$4">
                <XStack justify="space-between" width="100%">
                  <Text color="$gray12" fontSize="$textSm">
                    Monthly
                  </Text>
                  <Text color="$gray12" fontSize="$textSm">
                    {formatCurrency(monthlyBalance)}
                  </Text>
                </XStack>
                {isFutureMonth && (
                  <XStack justify="space-between" width="100%">
                    <Text color="$gray12" fontSize="$textSm">
                      Balance
                    </Text>
                    <Text color={colorBalance} fontSize="$textSm">
                      {formatCurrency(globalBalance)}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Accordion.Trigger>
            <Accordion.HeightAnimator animation="quick">
              <Accordion.Content
                animation="quick"
                bg="$cardBg"
                exitStyle={{ opacity: 0 }}
                width="100%"
              >
                <XStack>
                  <YStack gap="$2" width="100%">
                    <XStack items="flex-start" justify="space-between">
                      <YStack content="flex-start" items="flex-start">
                        <Text color="$gray11" fontSize="$textSm">
                          Incomes
                        </Text>
                      </YStack>
                      <YStack content="flex-end" items="flex-end">
                        <Text color="$gray11" fontSize="$textSm">
                          {formatCurrency(incomes)}
                        </Text>
                        {showPercentage && (
                          <Text
                            color={getPercentageColor(relIncomes, 'income')}
                            fontSize="$textXs"
                          >
                            {getTextPercentage(relIncomes)}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <Separator />
                    <XStack items="flex-start" justify="space-between">
                      <YStack content="flex-start" items="flex-start">
                        <Text color="$gray11" fontSize="$textSm">
                          Expenses
                        </Text>
                      </YStack>
                      <YStack content="flex-end" items="flex-end">
                        <Text color="$gray11" fontSize="$textSm">
                          {formatCurrency(expenses)}
                        </Text>
                        {showPercentage && (
                          <Text
                            color={getPercentageColor(relExpenses, 'expense')}
                            fontSize="$textXs"
                          >
                            {getTextPercentage(relExpenses)}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <Separator />
                    <XStack items="flex-start" justify="space-between">
                      <YStack content="flex-start" items="flex-start">
                        <Text color="$gray11" fontSize="$textSm">
                          Available
                        </Text>
                      </YStack>
                      <YStack content="flex-end" items="flex-end">
                        <Text color="$gray11" fontSize="$textSm">
                          {formatCurrency(available)}
                        </Text>
                        {showPercentage && (
                          <Text
                            color={getPercentageColor(relAvailable, 'income')}
                            fontSize="$textXs"
                          >
                            {getTextPercentage(relAvailable)}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    <Separator />
                    <XStack items="flex-start" justify="space-between">
                      <YStack content="flex-start" items="flex-start">
                        <Text color="$gray11" fontSize="$textSm">
                          Monthly balance
                        </Text>
                      </YStack>
                      <YStack content="flex-end" items="flex-end">
                        <Text color={colorBalance} fontSize="$textSm">
                          {formatCurrency(monthlyBalance)}
                        </Text>
                        {showPercentage && (
                          <Text
                            color={getPercentageColor(
                              relMonthlyBalance,
                              'income'
                            )}
                            fontSize="$textXs"
                          >
                            {getTextPercentage(relMonthlyBalance)}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                    {isFutureMonth && (
                      <React.Fragment>
                        <Separator />
                        <XStack items="flex-start" justify="space-between">
                          <YStack content="flex-start" items="flex-start">
                            <Text color="$gray11" fontSize="$textSm">
                              Global balance
                            </Text>
                          </YStack>
                          <YStack content="flex-end" items="flex-end">
                            <Text color={colorBalance} fontSize="$textSm">
                              {formatCurrency(globalBalance)}
                            </Text>
                            {showPercentage && (
                              <Text
                                color={getPercentageColor(
                                  relGlobalBalance,
                                  'income'
                                )}
                                fontSize="$textXs"
                              >
                                {getTextPercentage(relGlobalBalance)}
                              </Text>
                            )}
                          </YStack>
                        </XStack>
                      </React.Fragment>
                    )}
                  </YStack>
                </XStack>
              </Accordion.Content>
            </Accordion.HeightAnimator>
          </Accordion.Item>
        </Accordion>
      </Card.Footer>
    </Card>
  );

  function getColorBalance(): ColorTokens {
    if (isFutureMonth) {
      if (monthlyBalance < 0 || available < 0) {
        return '$yellow8';
      }
      if (globalBalance < 0) {
        return '$red10';
      }
      return '$green10';
    }
    return '$gray10';
  }

  function getTextPercentage(value: number) {
    if (value > 0) {
      return `+${value}%`;
    } else if (value < 0) {
      return `${value}%`;
    }
    return `${value}%`;
  }

  function getPercentageColor(
    value: number,
    type: 'income' | 'expense'
  ): ColorTokens {
    const godCond = type === 'income' ? value > 0 : value < 0;

    const badCond = type === 'income' ? value < 0 : value > 0;

    if (godCond) {
      return '$green10';
    }
    if (badCond) {
      return '$red10';
    }
    return '$gray11';
  }
};

type MonthDetailProps = {
  data: Array<EventBudgetType>;
  listBulk: Array<EventBudgetType>;
  handlers: ListActions<EventBudgetType>;
  setMonthlyEvent: (event: EventBudgetType) => void;
};

function MonthDetail(props: MonthDetailProps) {
  const { data, listBulk, handlers, setMonthlyEvent } = props;

  const buildFlowMemo = React.useCallback(buildFlow, [
    data,
    handlers,
    listBulk,
    setMonthlyEvent,
  ]);

  const tabsMemo = React.useMemo(() => {
    const tabs = [
      {
        title: 'All',
        value: 'all',
        content: buildFlowMemo('all'),
      },
      {
        title: 'Unique',
        value: 'unique',
        content: buildFlowMemo('unique'),
      },
      {
        title: 'Repeating',
        value: 'repeated',
        content: buildFlowMemo('repeated'),
      },
      {
        title: 'Always',
        value: 'always',
        content: buildFlowMemo('always'),
      },
    ] as Array<TabType>;

    return tabs;
  }, [buildFlowMemo]);

  return <TabsGroup tabs={tabsMemo} />;

  function buildFlow(selectedType: 'all' | 'repeated' | 'always' | 'unique') {
    let filteredData = data;

    let totalIncomes = 0;
    let totalExpenses = 0;

    if (selectedType === 'repeated') {
      filteredData = data.filter(({ repeat, type, amount }) => {
        const value =
          ['day', 'week', 'month', 'year'].includes(repeat.type) &&
          !repeat.isAlways;
        if (value) {
          if (type === 'income') {
            totalIncomes += amount;
          } else {
            totalExpenses += amount;
          }
        }

        return value;
      });
    }

    if (selectedType === 'always') {
      filteredData = data.filter(({ repeat, type, amount }) => {
        const value =
          ['day', 'week', 'month', 'year'].includes(repeat.type) &&
          repeat.isAlways;

        if (value) {
          if (type === 'income') {
            totalIncomes += amount;
          } else {
            totalExpenses += amount;
          }
        }

        return value;
      });
    }

    if (selectedType === 'all') {
      for (const item of data) {
        if (item.type === 'income') {
          totalIncomes += item.amount;
        } else {
          totalExpenses += item.amount;
        }
      }
    }

    if (selectedType === 'unique') {
      filteredData = data.filter(({ repeat, type, amount }) => {
        const value = !['day', 'week', 'month', 'year'].includes(repeat.type);

        if (value) {
          if (type === 'income') {
            totalIncomes += amount;
          } else {
            totalExpenses += amount;
          }
        }

        return value;
      });
    }

    return (
      <YStack gap={0} mt="$2">
        {filteredData.map((item, idx) => (
          <React.Fragment key={`flow-balance-${item.id}-${idx}`}>
            <FlowBalanceEvent
              data={item}
              handlers={handlers}
              key={`flow-balance-${idx}`}
              listBulk={listBulk}
              setMonthlyEvent={setMonthlyEvent}
            />
            {idx === filteredData.length - 1 ? null : (
              <Separator key={`separator-${idx}`} mx="$5" my="$1" />
            )}
          </React.Fragment>
        ))}

        <View mb="$-1" mt="$1" px="$4" py="$1" width="100%">
          <Separator mx="$-4" my="$2" />

          <YStack>
            <XStack justify="space-between">
              <Text color="$gray11" fontSize="$textSm">
                Incomes:
              </Text>
              <Text color="$gray11" fontSize="$textSm">
                {formatCurrency(totalIncomes)}
              </Text>
            </XStack>

            <XStack justify="space-between">
              <Text color="$gray11" fontSize="$textSm">
                Expenses:
              </Text>
              <Text color="$gray11" fontSize="$textSm">
                {formatCurrency(totalExpenses)}
              </Text>
            </XStack>
          </YStack>
        </View>
      </YStack>
    );
  }
}

type FlowBalanceEventProps = {
  data: EventBudgetType;
  listBulk: Array<EventBudgetType>;
  handlers: ListActions<EventBudgetType>;
  setMonthlyEvent: (event: EventBudgetType) => void;
};

function FlowBalanceEvent(props: FlowBalanceEventProps) {
  const { data: event, setMonthlyEvent, listBulk, handlers } = props;

  const completedByDates = isCompletedByDates(
    event.date,
    event.completedDates || []
  );

  const selected = listBulk.some((item) => item.id === event.id);

  return (
    <XStack
      bg={getFlowEventColor()}
      borderColor={selected ? '$blue11' : 'transparent'}
      borderWidth={1}
      ml="$2"
      mr="$3"
      py="$1"
      rounded="$2"
      onLongPress={() => {
        vibration();
        if (selected) {
          handlers.remove(listBulk.findIndex((item) => item.id === event.id));
        } else {
          handlers.add(event);
        }
      }}
      onPress={() => {
        if (listBulk.length) {
          vibration('light');
          if (selected) {
            handlers.remove(listBulk.findIndex((item) => item.id === event.id));
          } else {
            handlers.add(event);
          }
        } else {
          setMonthlyEvent(event);
        }
      }}
    >
      <View flexBasis="8%" flexDirection="column" justify="center">
        <GitCommitVertical
          color={getColorIcon(event.type, event.completed, completedByDates)}
          size="$1.5"
        />
      </View>
      <View grow={1}>
        <YStack key={event.id}>
          <XStack justify="space-between" pl="$2" pr="$2" py="$1">
            <YStack gap="$0.5" items="flex-start">
              <Text
                color={event.completed ? '$gray11' : '$gray12'}
                fontSize="$textSm"
              >
                {event.name}
              </Text>
              <Text
                color={event.completed ? '$gray11' : '$gray12'}
                fontSize="$textXs"
              >
                {moment.unix(event.date).format('MMMM DD')}{' '}
                <Text
                  color={event.completed ? '$gray10' : '$gray11'}
                  fontSize="$textXs"
                >
                  {getEventPeriod(event)}
                </Text>
              </Text>
            </YStack>
            <YStack items="flex-end">
              <Text
                color={
                  event.completed
                    ? event.type === 'expense'
                      ? '$red10'
                      : '$green10'
                    : event.type === 'expense'
                      ? '$red9'
                      : '$green8'
                }
                fontSize="$textSm"
              >
                {formatCurrency(event.amount)}
              </Text>
              {!event.completed && (
                <Text color="$gray11" fontSize="$textSm">
                  {formatCurrency(event.balance)}
                </Text>
              )}
            </YStack>
          </XStack>
        </YStack>
      </View>
    </XStack>
  );

  function getFlowEventColor(): ColorTokens {
    if (selected && listBulk.length) {
      return '$blue12';
    }
    return '$colorTransparent';
  }
}

export default MonthSchedule;
