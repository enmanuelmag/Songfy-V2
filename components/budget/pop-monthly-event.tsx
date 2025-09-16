import * as Burnt from 'burnt';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import DataRepo from '@api/datasource';
import ButtonCustom from '@components/shared/button';
import {
  GET_BUDGET_KEY,
  GET_SCHEDULE_KEY,
  UPDATE_EVENT_BALANCE_KEY,
  UPDATE_EVENT_KEY,
} from '@constants/reactAPI';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isCompletedByDates } from '@utils/budget';
import { Logger } from '@utils/log';



import { EventDetail } from './event';

import type {
  EventBudgetType,
  ToggleCompletedEventParamsType,
} from '@customTypes/budget';

type PopMonthlyEventProps = {
  budgetId: string;
  data: EventBudgetType;
  currentDate: number;
  setMonthlyEventPopOver: (value: EventBudgetType | null) => void;
};

const MonthlyEvent = (props: PopMonthlyEventProps) => {
  const queryClient = useQueryClient();

  const { budgetId, data: event, currentDate, setMonthlyEventPopOver } = props;

  const eventCompleteMutation = useMutation<
    boolean,
    Error,
    ToggleCompletedEventParamsType
  >({
    mutationKey: [UPDATE_EVENT_KEY, event.id],
    mutationFn: async (params) => {
      const response =
        await DataRepo.budgetsService.toggleEventCompleted(params);

      queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [GET_SCHEDULE_KEY, GET_BUDGET_KEY].includes(
            query.queryKey[0] as string
          ),
      });

      return response;
    },
    onSettled: (_, error) => {
      if (error) {
        Logger.error('Error updating event', error);
        Burnt.toast({
          preset: 'error',
          title: 'Error updating event',
        });
      } else {
        setMonthlyEventPopOver(null);
        Burnt.toast({
          preset: 'done',
          title: 'Event marked as completed',
        });
      }
    },
  });

  const eventBalanceMutation = useMutation<
    boolean,
    Error,
    ToggleCompletedEventParamsType
  >({
    mutationKey: [UPDATE_EVENT_BALANCE_KEY, event.id],
    mutationFn: async (params) => {
      const response = await DataRepo.budgetsService.toggleEventBalance(params);

      queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [GET_SCHEDULE_KEY, GET_BUDGET_KEY].includes(
            query.queryKey[0] as string
          ),
      });

      return response;
    },
    onSettled: (_, error) => {
      if (error) {
        Logger.error('Error updating event', error);
        Burnt.toast({
          preset: 'error',
          title: 'Error updating event',
        });
      } else {
        setMonthlyEventPopOver(null);
        Burnt.toast({
          preset: 'done',
          title: 'Event marked as completed',
        });
      }
    },
  });

  const completedByDates = isCompletedByDates(
    event.date,
    event.completedDates || []
  );

  return (
    <YStack rowGap="$1.5">
      <Text color="$gray12" fontSize="$textLg" fontWeight="600">
        {event.name}
      </Text>
      {event.description && (
        <Text color="$gray11" fontSize="$textSm">
          {event.description}
        </Text>
      )}

      <Separator my="$3" />

      <EventDetail data={event} />

      <XStack gap="$2" justify="flex-end">
        {currentDate < event.date && (
          <View mt="$8">
            <ButtonCustom
              color={event.completed ? 'red' : 'green'}
              fullWidth={false}
              loading={
                eventCompleteMutation.isPending && !eventCompleteMutation.isIdle
              }
              text={event.completed ? 'Undo done' : 'Mark done'}
              onPress={() =>
                eventCompleteMutation.mutate({
                  budgetId,
                  eventId: event.id,
                  targetDate: event.date,
                  currentCompleted: Boolean(event.completed),
                })
              }
            />
          </View>
        )}
        {currentDate >= event.date && event.completed && (
          <View mt="$3">
            <ButtonCustom
              color={completedByDates ? 'gray' : 'green'}
              fullWidth={false}
              loading={
                eventBalanceMutation.isPending && !eventBalanceMutation.isIdle
              }
              text={completedByDates ? 'Undo balance' : 'Update balance'}
              onPress={() =>
                eventBalanceMutation.mutate({
                  budgetId,
                  eventId: event.id,
                  targetDate: event.date,
                  currentCompleted: Boolean(event.completed),
                })
              }
            />
          </View>
        )}
      </XStack>
    </YStack>
  );
};

export default MonthlyEvent;
