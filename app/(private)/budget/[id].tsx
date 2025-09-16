import * as Burnt from 'burnt';
import moment from 'moment';
import { Controller, useFormContext } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import Event from '@components/budget/event';
import EventAI from '@components/budget/event-ai';
import ActionIcon from '@components/shared/action-icon';
import ConfirmModal from '@components/shared/confirm-modal';
import CurrencyInput from '@components/shared/currency-input';
import DatePickerCustom from '@components/shared/date-picker';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import SelectCustom from '@components/shared/select';
import TabsAdvanced from '@components/shared/tabs';
import { EndDateRangeOptions } from '@constants/budget';
import {
  CREATE_UPDATE_BUDGET_KEY,
  GET_AI_EVENTS_KEY,
  GET_BUDGET_KEY,
  GET_SCHEDULE_KEY,
  LIST_BUDGET_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useDebounceState } from '@hooks/input';
import { useAppStore } from '@store/index';
import { AtSign, CalendarPlus, HelpCircle, Save } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isArchivedEvent } from '@utils/budget';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';
import { navigate } from '@utils/router';

import type { TabType } from '@components/shared/tabs';
import type { AIDetectedEventType } from '@customTypes/ai-event-detected';
import type {
  BudgetBaseType,
  BudgetExtendedType,
  EventBaseType,
} from '@customTypes/budget';
import type { ScrollView } from 'react-native';

const Budget = () => {
  const { currency } = useAppStore();

  const queryClient = useQueryClient();

  const refScroll = React.useRef<ScrollView>(null);

  const { id } = useLocalSearchParams<{ id: string }>();

  const [deletePopOver, setDeletePopOver] =
    React.useState<EventBaseType | null>();

  const [query, debouncedQuery, setQuery, debouncing] =
    useDebounceState<string>('', 1000);

  const mode = id ? 'edit' : 'create';

  const budgetEditQuery = useQuery<BudgetExtendedType, Error>({
    enabled: mode === 'edit',
    queryKey: [GET_BUDGET_KEY, id],
    queryFn: async () => {
      const budget = await DataRepo.budgetsService.getBudget(id);
      return budget;
    },
  });

  const eventsAIDetectedQuery = useQuery({
    enabled: Boolean(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryKey: [GET_AI_EVENTS_KEY, id],
    queryFn: async () => {
      const events = await DataRepo.aiEventsService.getAIDetectedEvents({
        budgetId: id,
      });
      return events;
    },
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useFormContext<BudgetExtendedType>();

  const createBudgetMutation = useMutation<
    BudgetBaseType,
    Error,
    BudgetExtendedType
  >({
    networkMode: 'always',
    mutationKey: [CREATE_UPDATE_BUDGET_KEY, id],
    mutationFn: async (data) => {
      let response: BudgetBaseType;
      data.events = [...data.events, ...data.eventsArchived];
      if (mode === 'create') {
        response = await DataRepo.budgetsService.createBudget(data);
      } else {
        response = await DataRepo.budgetsService.updateBudget(
          String(id),
          data as BudgetBaseType
        );
      }

      return response;
    },
    onSettled: (_, error) => onSettledFunction(true, error),
  });

  const eventWatch = watch('events');
  const eventInactive = watch('eventsArchived');
  const endMonthsWatch = watch('endMonths');

  React.useEffect(() => {
    if (mode === 'create') {
      setValue('startDate', moment().unix());
    } else if (budgetEditQuery.data) {
      reset(budgetEditQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, budgetEditQuery.data, mode]);

  const tabsMemo = React.useMemo(() => {
    const tempArchived: Array<EventBaseType> = [...eventInactive];
    const tempActive: Array<EventBaseType> = eventWatch.filter((event) => {
      if (isArchivedEvent(event)) {
        tempArchived.push(event);
        return false;
      }
      return true;
    });

    const tabs: Array<TabType> = [
      {
        value: 'active',
        title: 'Active',
        content: buildEvents(
          tempActive,
          <YStack bg="$bgApp" gap="$1" justify="center" mt="$8" px="$6">
            {mode === 'edit' && Boolean(eventWatch.length) && (
              <LoaderText text="Loading events" />
            )}
            {mode === 'create' ||
              (!eventWatch.length && (
                <Text color="$gray11" fontSize="$5" text="center">
                  Add events to the budget. At least one event is required
                </Text>
              ))}
          </YStack>
        ),
      },
      {
        value: 'ai-detected',
        title: 'AI Detected',
        content: buildAIDetectedEvents(eventsAIDetectedQuery.data),
      },
      {
        value: 'inactive',
        title: 'Inactive',
        content: buildEvents(tempArchived),
      },
    ];

    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, eventInactive, eventWatch, eventsAIDetectedQuery]);

  if (isLoadingRefetchQuery(budgetEditQuery)) {
    return (
      <View
        bg="$bgApp"
        flex={1}
        flexDirection="column"
        height="100%"
        justify="center"
      >
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$5" text="center">
                {mode === 'create' ? 'Create budget' : 'Edit budget'}
              </Text>
            ),
          }}
        />
        <LoaderText text="Loading budget" />
      </View>
    );
  }

  const isDisabled = btnDisabled();

  return (
    <DismissKeyboardHOC>
      <GradientList ref={refScroll}>
        <YStack height="100%" justify="space-between" p="$3" width="100%">
          <Stack.Screen
            options={{
              headerTitle: () => (
                <Text color="$primary" fontSize="$5">
                  {mode === 'create' ? 'Create budget' : 'Edit budget'}
                </Text>
              ),
              headerRight: () => <HelperPopover />,
            }}
          />

          <YStack gap="$3">
            <YStack gap="$1.5">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <InputText
                    error={errors.name?.message}
                    label="Name"
                    placeholder="Budget name"
                    {...field}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <InputText
                    error={errors.description?.message}
                    label="Description"
                    placeholder="Budget description"
                    {...field}
                  />
                )}
              />

              <Controller
                control={control}
                name="initialBalance"
                render={({ field }) => (
                  <CurrencyInput
                    error={errors.initialBalance?.message}
                    label="Initial balance"
                    placeholder="Type the initial balance"
                    symbol={currency.symbol}
                    {...field}
                  />
                )}
              />

              <XStack>
                <View flexBasis="50%" pr="$1.5">
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <DatePickerCustom
                        isModal
                        error={errors.startDate?.message}
                        mode="date"
                        title="Start date"
                        {...field}
                        onConfirm={(date) => {
                          const dateStart = moment
                            .unix(date)
                            .startOf('day')
                            .unix();
                          field.onChange(dateStart);
                        }}
                      />
                    )}
                  />
                </View>
                <View flexBasis="50%" pl="$1.5">
                  <Controller
                    control={control}
                    name="endMonths"
                    render={({ field }) => (
                      <SelectCustom
                        error={errors.endMonths?.message}
                        items={EndDateRangeOptions}
                        label="End date"
                        placeholder="Select end date"
                        value={EndDateRangeOptions.find(
                          (c) => c.id === String(endMonthsWatch)
                        )}
                        onChange={(rangeOption) => {
                          const optionSelect = EndDateRangeOptions.find(
                            (c) => c.id === rangeOption.id
                          );
                          const monthsSelected = Number(optionSelect?.id);
                          if (monthsSelected) {
                            field.onChange(monthsSelected);
                          }
                        }}
                      />
                    )}
                  />
                </View>
              </XStack>
            </YStack>

            <Separator mt="$1" />

            <ConfirmModal
              closeText="No, keep it"
              confirmText="Yes, delete it"
              content={
                <Text color="$gray11" fontSize="$5">
                  Are you sure you want to delete the event{' '}
                  <Text fontSize="$5" fontWeight="600">
                    {deletePopOver?.name}
                  </Text>
                  ?
                </Text>
              }
              open={Boolean(deletePopOver)}
              title="Delete event"
              onConfirm={() => {
                if (deletePopOver) {
                  setValue(
                    'events',
                    eventWatch.filter((event) => event.id !== deletePopOver.id),
                    { shouldDirty: true, shouldValidate: true }
                  );
                  setDeletePopOver(null);
                }
              }}
              onOpenChange={(v) => {
                if (!v) {
                  setDeletePopOver(null);
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
            </ConfirmModal>
          </YStack>
        </YStack>
      </GradientList>
      <FloatingButtons key="floating-budget">
        <ActionIcon
          color="neutral"
          icon={<AtSign color="white" size={22} />}
          onPress={() => {
            navigate({
              to: Routes.EVENT_EMAIL,
            });
          }}
        />
        <ActionIcon
          color="blue"
          icon={<CalendarPlus color="white" size={22} />}
          onPress={() => {
            navigate({
              to: Routes.EVENT_CREATE_MODAL,
              params: { id: 'no-id' },
            });
          }}
        />
        <ActionIcon
          color="green"
          disabled={isDisabled}
          icon={<Save color={isDisabled ? '$gray10' : 'white'} size={22} />}
          loading={
            createBudgetMutation.isPending && !createBudgetMutation.isIdle
          }
          onPress={() => {
            if (eventWatch.length === 0) {
              Burnt.toast({
                preset: 'error',
                title: 'At least one event is required',
              });
            }
            if (isDirty) {
              console.log('Form is dirty');
              vibration('rigid');
              handleSubmit(
                (data) => createBudgetMutation.mutate(data),
                (invalid) => {
                  console.log('Form is invalid', invalid);
                }
              )();
            } else {
              console.log('Form is not dirty');
              vibration('medium');
              onSettledFunction(false, null);
            }
          }}
        />
      </FloatingButtons>
    </DismissKeyboardHOC>
  );

  function buildEvents(
    items: Array<EventBaseType>,
    emptyText?: React.ReactElement
  ) {
    if (!items.length) {
      return React.isValidElement(emptyText) ? (
        emptyText
      ) : (
        <YStack justify="center" pt="$8">
          <Text color="$gray11" fontSize="$4" text="center">
            No events yet
          </Text>
        </YStack>
      );
    }

    if (debouncedQuery.length) {
      items = items.filter((event) =>
        event.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    return items.map((event, index) => (
      <View
        key={event.id}
        mb={index === items.length - 1 ? '$20' : '$2'}
        onPress={() => null}
      >
        <Event
          data={event}
          onDelete={() => setDeletePopOver(event)}
          onEdit={() => {
            navigate({
              to: Routes.EVENT_CREATE_MODAL,
              params: { id: event.id },
            });
          }}
        />
      </View>
    ));
  }

  function buildAIDetectedEvents(events?: Array<AIDetectedEventType>) {
    if (!events || events.length === 0) {
      return (
        <YStack gap="$4" justify="center" pt="$8">
          <Text color="$gray11" fontSize="$4" text="center">
            No AI detected events yet
          </Text>
          <YStack gap="$2" px="$4">
            <Text
              color="$gray11"
              fontSize="$4"
              text="center"
              textWrap="balance"
            >
              Make sure you properly configure your filter emails.
            </Text>
            <Text
              color="$gray11"
              fontSize="$4"
              text="center"
              textWrap="balance"
            >
              Go "@" sign icon to add sender emails to filter and the
              destination email.
            </Text>
          </YStack>
        </YStack>
      );
    }

    if (debouncedQuery.length) {
      events = events.filter((event) =>
        event.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    return events.map((event, index) => (
      <View
        key={event.id}
        mb={index === events.length - 1 ? '$20' : '$2'}
        onPress={() => null}
      >
        <EventAI
          data={event}
          onDelete={() => {}}
          onEdit={() => {
            router.push({
              pathname: Routes.EVENT_CREATE_MODAL.replace(':id', event.id),
              params: { ai: 'true' },
            });
          }}
        />
      </View>
    ));
  }

  function btnDisabled() {
    return !isEmpty(errors) || !isDirty;
  }

  async function onSettledFunction(
    changed?: boolean | null,
    error?: Error | null
  ) {
    if (error) {
      Burnt.toast({
        title:
          error.message ||
          `Error ${mode === 'create' ? 'creating' : 'updating'} budget`,
        preset: 'error',
      });
      return;
    }
    navigate({
      to: Routes.BUDGETS,
    });
    reset();
    if (changed) {
      Burnt.toast({
        preset: 'done',
        title: `Budget ${mode === 'create' ? 'created' : 'updated'}`,
      });

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (q) =>
          [LIST_BUDGET_KEY, GET_BUDGET_KEY, GET_SCHEDULE_KEY].includes(
            q.queryKey[0] as string
          ),
      });
    }
  }
};

function HelperPopover() {
  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          <YStack rowGap="$1">
            <Text color="$gray12" fontSize="$textXl" fontWeight="600">
              What is a Budget and how to use it?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              A budget is a feature where you can define events that will happen
              in the future and how much money you will spend, or receive. To
              see how will be your balance in the future.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              In this form you can define a name, description, initial balance,
              start date, and end date. This last field is defined in months, so
              if you set 3 months, the budget will end in 3 months, starting
              from the current date.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              Finally, you can add events to the budget. Each event can be a
              payment or a receipt, and you can define the a name, description,
              amount, and date. Also, you can define if the event is periodic,
              and how often it will happen.
            </Text>
            <View height={50} />
          </YStack>
        </GradientList>
      }
    >
      <ActionIcon
        onlyIcon
        icon={<HelpCircle color="$gray12" size="$1.5" />}
        variant="icon"
      />
    </PopOver>
  );
}

export default Budget;
