import 'react-native-get-random-values';

import * as Burnt from 'burnt';
import moment from 'moment';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';
import { v4 as uuidv4 } from 'uuid';

import React from 'react';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import ActionIcon from '@components/shared/action-icon';
import CurrencyInputCustom from '@components/shared/currency-input';
import DatePickerCustom from '@components/shared/date-picker';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import SelectCustom from '@components/shared/select';
import SwitchWithLabel from '@components/shared/switch-custom';
import { NotSupportNotifications } from '@constants/app';
import { EventOptions, RepeatOptions } from '@constants/budget';
import {
  CREATE_UPDATE_EVENT_KEY,
  GET_AI_EVENT_KEY,
  GET_BUDGET_KEY,
  GET_EVENT_KEY,
  LIST_CATEGORY_KEY,
} from '@constants/reactAPI';
import { EventBaseSchema } from '@customTypes/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@store/index';
import { HelpCircle, Save } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAIEventToBase } from '@utils/budget';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingQuery } from '@utils/network';
import { getNotificationSettings } from '@utils/notifications';
import { isAndroid } from '@utils/platform';

import type {
  BudgetExtendedType,
  CategoryType,
  EventBaseType,
  RepeatType,
} from '@customTypes/budget';

const Event = () => {
  const queryClient = useQueryClient();

  const { id, ai } = useLocalSearchParams<{ id: string; ai: string }>();

  const { currency, notificationSettings, setNotificationSettings } =
    useAppStore();

  const mode = id && id !== 'no-id' ? 'edit' : 'create';

  const formNested = useFormContext<BudgetExtendedType>();

  const eventEditQuery = useQuery<EventBaseType, Error>({
    enabled: mode === 'edit' && !ai,
    queryKey: [GET_EVENT_KEY, id, ai],
    queryFn: () => {
      const event = formNested.getValues('events').find((e) => e.id === id);

      if (!event) {
        throw new Error('Event not found');
      }

      return event;
    },
  });

  const eventAIDetectedQuery = useQuery({
    enabled: Boolean(ai === 'true' && id),
    queryKey: [GET_AI_EVENT_KEY, id],
    queryFn: async () => {
      const event = await DataRepo.aiEventsService.getAIEvent({
        eventId: id,
      });
      return event;
    },
  });

  const {
    reset: resetEvent,
    watch: watchEvent,
    control: controlEvent,
    setValue: setValueEvent,
    handleSubmit: handleSubmitEvent,
    formState: { errors: errorsEvent, isDirty: isDirtyEvent },
  } = useForm<EventBaseType>({
    defaultValues: {
      id: uuidv4(),
      name: '',
      description: '',
      date: moment().unix(),
      amount: 0,
      category: null,
      completedDates: [],
      repeat: {
        times: 1,
        type: 'unique',
        isAlways: false,
      },
      type: 'expense',
      timeNotification: {
        enabled: false,
        hour: 9,
        minute: 0,
      },
    },
    resolver: zodResolver(EventBaseSchema),
  });

  React.useEffect(() => {
    if (id) {
      let data: EventBaseType | undefined;
      if (ai && eventAIDetectedQuery.data) {
        data = parseAIEventToBase(eventAIDetectedQuery.data);
      } else if (eventEditQuery.data) {
        data = eventEditQuery.data;
      }
      resetEvent(data, {
        keepDefaultValues: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventEditQuery.data, id]);

  const crudEventMutation = useMutation<EventBaseType, Error, EventBaseType>({
    mutationKey: [CREATE_UPDATE_EVENT_KEY, id],
    mutationFn: async (event) => {
      const eventsForm = formNested.getValues('events');
      const promise = new Promise<EventBaseType>((resolve) => {
        setTimeout(() => {
          const eventSanitized = sanitizeEvent(event);

          if (mode === 'edit') {
            formNested.setValue(
              'events',
              eventsForm.map((e) => (e.id === event.id ? eventSanitized : e)),
              {
                shouldDirty: true,
                shouldValidate: true,
              }
            );
          } else {
            formNested.setValue('events', [...eventsForm, eventSanitized], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }

          resolve(eventSanitized);
        }, 1);
      });

      return await promise;
    },
    onSettled: (_, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'An error occurred',
        });
      }

      router.back();
      resetEvent();

      queryClient.invalidateQueries({
        exact: true,
        refetchType: 'all',
        queryKey: [GET_EVENT_KEY, id],
      });

      queryClient.invalidateQueries({
        exact: true,
        refetchType: 'all',
        queryKey: [GET_BUDGET_KEY, GET_EVENT_KEY, id],
      });
    },
  });

  const categoriesQuery = useQuery<Array<CategoryType>, Error>({
    initialData: [],
    queryKey: [LIST_CATEGORY_KEY],
    queryFn: async () => await DataRepo.categoriesService.getCategories(),
  });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const timeNotificationWatch = watchEvent('timeNotification') || {};

  React.useEffect(() => {
    if (!timeNotificationWatch.enabled) return;

    getNotificationSettings().then((s) => {
      if (s.status !== 'granted') {
        setNotificationSettings(s);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeNotificationWatch.enabled]);

  React.useEffect(() => {
    if (
      timeNotificationWatch.enabled &&
      notificationSettings &&
      !notificationSettings.granted
    ) {
      setValueEvent('timeNotification.enabled', false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSettings, timeNotificationWatch.enabled]);

  const categoryWatch = watchEvent('category');
  const eventTypeWatch = watchEvent('type');
  const repeatWatch = watchEvent('repeat');

  const isDisabled = btnDisabled();

  const isLoading = isLoadingQuery(eventEditQuery, eventAIDetectedQuery);

  console.log(
    'isLoading:',
    eventEditQuery.isFetching,
    eventAIDetectedQuery.isFetching
  );

  return (
    <DismissKeyboardHOC>
      <YStack bg="$bgApp" height="100%" justify="space-between" p="$3">
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$textMd">
                {mode === 'create' ? 'Create event' : 'Edit event'}
              </Text>
            ),
            headerRight: () => <HelperPopover />,
          }}
        />

        {isLoading && (
          <View height="100%" items="center" justify="center">
            <LoaderText text="Loading event" />
          </View>
        )}

        {!isLoading && (
          <React.Fragment>
            <GradientList>
              <YStack gap="$3">
                <Controller
                  control={controlEvent}
                  name="name"
                  render={({ field }) => (
                    <InputText
                      error={errorsEvent.name?.message}
                      label="Name"
                      placeholder="Event name"
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={controlEvent}
                  name="description"
                  render={({ field }) => (
                    <InputText
                      error={errorsEvent.description?.message}
                      label="Description"
                      placeholder="Description name"
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={controlEvent}
                  name="category"
                  render={({ field }) => (
                    <SelectCustom
                      error={errorsEvent.category?.message}
                      items={categoriesQuery.data}
                      label="Category"
                      placeholder="Select category"
                      {...field}
                      value={categoriesQuery.data.find(
                        (c) => c.id === categoryWatch?.id
                      )}
                      onChange={(category) => {
                        const categorySelected = categoriesQuery.data.find(
                          (c) => c.id === category.id
                        );
                        if (categorySelected) {
                          setValueEvent('category', categorySelected, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  )}
                />
                <Controller
                  control={controlEvent}
                  name="date"
                  render={({ field }) => (
                    <DatePickerCustom
                      isModal
                      error={errorsEvent.date?.message}
                      mode="date"
                      title="Date"
                      {...field}
                      onConfirm={field.onChange}
                    />
                  )}
                />

                <XStack>
                  <View flexBasis="50%" pr="$1.5">
                    <Controller
                      control={controlEvent}
                      name="amount"
                      render={({ field }) => (
                        <CurrencyInputCustom
                          error={errorsEvent.amount?.message}
                          label="Amount"
                          placeholder="Type the amount"
                          symbol={currency.symbol}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </View>
                  <View flexBasis="50%" pl="$1.5">
                    <Controller
                      control={controlEvent}
                      name="type"
                      render={({ field }) => (
                        <SelectCustom
                          error={errorsEvent.type?.message}
                          items={EventOptions}
                          label="Type"
                          placeholder="Select type"
                          {...field}
                          value={EventOptions.find(
                            (c) => c.id === eventTypeWatch
                          )}
                          onChange={(eventType) => {
                            const typeSelected = EventOptions.find(
                              (c) => c.id === eventType.id
                            );
                            if (typeSelected)
                              setValueEvent(
                                'type',
                                typeSelected.id as EventBaseType['type'],
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                          }}
                        />
                      )}
                    />
                  </View>
                </XStack>

                <Separator my="$2" />

                <XStack items="center">
                  <View flexBasis="50%" pr="$1.5">
                    <Controller
                      control={controlEvent}
                      name="timeNotification.enabled"
                      render={({ field }) => (
                        <SwitchWithLabel
                          disabled={
                            isAndroid &&
                            NotSupportNotifications.ANDROID.includes(
                              repeatWatch.type
                            )
                          }
                          label="Notification"
                          {...field}
                          value={Boolean(field.value)}
                          onChange={(v) => {
                            setValueEvent('timeNotification.enabled', v, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                      )}
                    />
                  </View>
                  <View flexBasis="50%" pl="$1.5">
                    {timeNotificationWatch.enabled && (
                      <Controller
                        control={controlEvent}
                        name="timeNotification"
                        render={({ field }) => (
                          <DatePickerCustom
                            isModal
                            disabled={!field.value.enabled}
                            error={errorsEvent.timeNotification?.message}
                            mode="time"
                            ref={field.ref}
                            value={moment()
                              .set('hours', timeNotificationWatch.hour || 9)
                              .set('minutes', timeNotificationWatch.minute || 0)
                              .unix()}
                            onConfirm={(date) => {
                              const dateMoment = moment.unix(date);
                              setValueEvent(
                                'timeNotification.hour',
                                dateMoment.hour(),
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                              setValueEvent(
                                'timeNotification.minute',
                                dateMoment.minute(),
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                            }}
                          />
                        )}
                      />
                    )}
                  </View>
                </XStack>
                <Separator my="$2" />

                <XStack>
                  <View flexBasis="50%" pr="$1.5">
                    <Controller
                      control={controlEvent}
                      name="repeat.type"
                      render={({ field }) => (
                        <SwitchWithLabel
                          label="Repeat"
                          {...field}
                          value={repeatWatch.type !== 'unique'}
                          onChange={(v) => {
                            setValueEvent(
                              'repeat.type',
                              v ? 'month' : 'unique',
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              }
                            );
                          }}
                        />
                      )}
                    />
                  </View>
                  <View flexBasis="50%" pl="$1.5">
                    {repeatWatch.type !== 'unique' && (
                      <Controller
                        control={controlEvent}
                        name="repeat.isAlways"
                        render={({ field }) => (
                          <SwitchWithLabel
                            disabled={repeatWatch.type === 'unique'}
                            label="Always"
                            {...field}
                            value={Boolean(field.value)}
                            onChange={(v) =>
                              setValueEvent('repeat.isAlways', v, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        )}
                      />
                    )}
                  </View>
                </XStack>

                {repeatWatch.type !== 'unique' && (
                  <XStack>
                    <View flexBasis="50%" pr="$1.5">
                      <Controller
                        control={controlEvent}
                        name="repeat.times"
                        render={({ field }) => (
                          <InputText
                            disabled={repeatWatch.isAlways}
                            error={errorsEvent.repeat?.times?.message}
                            keyboardType="numeric"
                            label="Times"
                            placeholder="Times"
                            readOnly={repeatWatch.isAlways}
                            {...field}
                            onChange={(v) =>
                              setValueEvent('repeat.times', Number(v), {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        )}
                      />
                    </View>
                    <View flexBasis="50%" pl="$1.5">
                      <Controller
                        control={controlEvent}
                        name="repeat.type"
                        render={({ field }) => (
                          <SelectCustom
                            defaultValue={RepeatOptions[1]}
                            items={RepeatOptions}
                            label="Type"
                            placeholder="Select type"
                            {...field}
                            value={RepeatOptions.find(
                              (c) => c.id === repeatWatch.type
                            )}
                            onChange={(eventType) => {
                              const typeSelected = RepeatOptions.find(
                                (c) => c.id === eventType.id
                              );
                              if (typeSelected)
                                setValueEvent(
                                  'repeat.type',
                                  typeSelected.id as RepeatType,
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  }
                                );
                            }}
                          />
                        )}
                      />
                    </View>
                  </XStack>
                )}
              </YStack>
            </GradientList>

            <FloatingButtons key="floating-event">
              <ActionIcon
                color="green"
                disabled={isDisabled}
                icon={
                  <Save color={isDisabled ? '$gray10' : 'white'} size={22} />
                }
                loading={crudEventMutation.isPending}
                onPress={() => {
                  vibration('rigid');
                  handleSubmitEvent((data) => crudEventMutation.mutate(data))();
                }}
              />
            </FloatingButtons>
          </React.Fragment>
        )}
      </YStack>
    </DismissKeyboardHOC>
  );

  function sanitizeEvent(event: EventBaseType) {
    event.category = event.category ?? null;

    return event;
  }

  function btnDisabled() {
    return !isDirtyEvent || !isEmpty(errorsEvent);
  }
};

function HelperPopover() {
  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          <YStack rowGap="$1">
            <Text color="$gray12" fontSize="$textXl" fontWeight="600">
              What is an event in a budget?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              An event is a payment or receipt that you can add to a budget. You
              can define the name, description, category, amount, date, and if
              it is periodic.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              If the event is periodic, you can define how often it will happen,
              and if it will happen always.
            </Text>
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

export default Event;
