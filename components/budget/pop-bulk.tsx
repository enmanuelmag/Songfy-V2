import * as Burnt from 'burnt';
import { Separator, Text, XStack } from 'tamagui';

import React from 'react';

import DataRepo from '@api/datasource';
import ButtonCustom from '@components/shared/button';
import QKeys from '@constants/react-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Logger } from '@utils/log';
import { isLoadingMutation } from '@utils/network';

import type {
  BulkToggleCompletedEventParamsType,
  EventBudgetType,
} from '@customTypes/budget';

type PopBulkProps = {
  budgetId: string;
  currentDate: number;
  data: Array<EventBudgetType>;
  onCancel: () => void;
  onDone: () => void;
};

const PopBulk = (props: PopBulkProps) => {
  const { budgetId, currentDate, data, onCancel, onDone } = props;

  const queryClient = useQueryClient();

  const updateBalanceMutation = useMutation<
    boolean,
    Error,
    BulkToggleCompletedEventParamsType
  >({
    mutationFn: async (params) => {
      const response =
        await DataRepo.budgetsService.bulkToggleEventBalance(params);

      queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [QKeys.GET_SCHEDULE_KEY, QKeys.GET_BUDGET_KEY].includes(
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
        return;
      }

      Burnt.toast({
        preset: 'done',
        title: 'Balance updated',
      });

      onDone();
    },
  });

  return (
    <React.Fragment>
      <Text color="$gray11" fontSize="$textXl" fontWeight="600">
        Update balance
      </Text>
      <Separator my="$3" />
      <Text color="$gray10" fontSize="$textMd">
        The balance will be update with the amount of {data.length} events
      </Text>
      <XStack gap="$2" justify="flex-end" mt="$3">
        <ButtonCustom
          color="green"
          fullWidth={false}
          loading={isLoadingMutation(updateBalanceMutation)}
          text="Update"
          onPress={() => {
            updateBalanceMutation.mutate({
              budgetId,
              events: data.map(({ id, date, completed }) => ({
                eventId: id,
                targetDate: date,
                currentCompleted: Boolean(completed),
                toggleType: currentDate < date ? 'completed' : 'balance',
              })),
            });
          }}
        />
        <ButtonCustom
          fullWidth={false}
          text="Cancel"
          variant="outline"
          onPress={onCancel}
        />
      </XStack>
    </React.Fragment>
  );
};

export default PopBulk;
