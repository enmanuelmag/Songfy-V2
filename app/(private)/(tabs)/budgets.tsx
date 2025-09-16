import * as Burnt from 'burnt';
import { Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { AppState } from 'react-native';

import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';

import DataRepo from '@api/datasource';
import EmptyBudgets from '@assets/budgets/empty-budgets';
import Budget from '@components/budget/budget';
import ActionIcon from '@components/shared/action-icon';
import ButtonCustom from '@components/shared/button';
import ConfirmModal from '@components/shared/confirm-modal';
import EmptyState from '@components/shared/empty-state';
import FlatGradientList from '@components/shared/flat-gradient-list';
import FloatingButtons from '@components/shared/floating-buttons';
import LoaderText from '@components/shared/loader-text';
import TabBatLiquid from '@components/shared/tab-bar-liquid-glass';
import QKeys from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';
import { CalendarPlus } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  isLoadingMutation,
  isLoadingQuery,
  onAppStateChange,
} from '@utils/network';
import {
  getNotificationSettings,
  requestNotificationPermission,
} from '@utils/notifications';
import { isIOS } from '@utils/platform';
import { navigate } from '@utils/router';

import type { BudgetBaseType } from '@customTypes/budget';

const Budgets = () => {
  const { notificationSettings, setNotificationSettings } = useAppStore();

  const queryClient = useQueryClient();

  const [localRefresh, setLocalRefresh] = React.useState(false);

  const budgetsQuery = useQuery<Array<BudgetBaseType>, Error>({
    networkMode: 'always',
    queryKey: [QKeys.LIST_BUDGET_KEY],
    queryFn: async () => await DataRepo.budgetsService.getBudgets(),
  });

  const budgetDeleteMutation = useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => {
      const response = await DataRepo.budgetsService.deleteBudget(id);

      await queryClient.invalidateQueries({
        refetchType: 'all',
        queryKey: [QKeys.LIST_BUDGET_KEY],
      });

      return response;
    },
    onSettled: (_, error) => {
      if (!error) {
        Burnt.toast({
          preset: 'done',
          title: 'Budget deleted',
        });
      } else {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'Error deleting budget',
        });
      }
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      getNotificationSettings().then((s) => {
        if (s.status !== 'granted') {
          setNotificationSettings(s);
        }
      });
    }, [setNotificationSettings])
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <ConfirmModal
      closeText="Deny"
      confirmColor="green"
      confirmText="Allow"
      content={
        <Text color="$gray11" fontSize="$textMd">
          Budgetfy needs notification permissions to remind when a event is
          happening.
        </Text>
      }
      open={!!notificationSettings && notificationSettings.status !== 'granted'}
      title="Notification permission"
      onConfirm={() => {
        if (
          notificationSettings?.status !== 'granted' &&
          notificationSettings?.canAskAgain
        ) {
          if (isIOS) {
            requestNotificationPermission();
          } else {
            Linking.openSettings().finally(() => setNotificationSettings(null));
          }
        } else {
          Burnt.toast({
            title: 'Notification permission already granted',
            preset: 'none',
          });
        }
        setNotificationSettings(null);
      }}
      onOpenChange={(v) => {
        if (!v) setNotificationSettings(null);
      }}
    >
      <YStack bg="$bgApp" height="100%">
        {(isLoadingQuery(budgetsQuery) ||
          isLoadingMutation(budgetDeleteMutation)) && (
          <View height="100%" items="center" justify="center">
            <LoaderText text="Loading budgets" />
          </View>
        )}

        {budgetsQuery.isSuccess && budgetsQuery.data.length === 0 && (
          <YStack height="100%" pt="$2" px="$4">
            <EmptyState image={<EmptyBudgets />} text="No budgets found">
              <XStack justify="center" minW={200} mt="$4">
                <ButtonCustom
                  text="Create a budget"
                  onPress={() => {
                    // vibration();
                    // router.push(Routes.BUDGET_CREATE);
                    navigate({
                      to: Routes.BUDGET_CREATE,
                    });
                  }}
                />
              </XStack>
              <XStack justify="center" minW={200} mt="$1">
                <ButtonCustom
                  text="Create categories"
                  variant="outline"
                  onPress={() => {
                    navigate({
                      to: Routes.CATEGORIES,
                    });
                  }}
                />
              </XStack>
            </EmptyState>
          </YStack>
        )}

        {budgetsQuery.isSuccess && Boolean(budgetsQuery.data.length) && (
          <YStack gap="$2" height="100%" justify="flex-start" pt="$2" px="$3">
            <FlatGradientList
              isRefetching={budgetsQuery.isRefetching || localRefresh}
              items={budgetsQuery.data}
              refetch={() => {
                setLocalRefresh(true);
                queryClient
                  .invalidateQueries({
                    type: 'all',
                    refetchType: 'all',
                    predicate: (query) =>
                      [
                        QKeys.BUDGET_ENTITY,
                        QKeys.BUDGETS_ENTITY,
                        QKeys.EVENT_ENTITY,
                        QKeys.EVENTS_ENTITY,
                        QKeys.SCHEDULE_ENTITY,
                      ].some((e) => (query.queryKey[0] as string).includes(e)),
                  })
                  .finally(() => {
                    budgetsQuery.refetch();
                    setLocalRefresh(false);
                  });
              }}
              renderItem={({ item, index }) => (
                <View
                  mb={index === budgetsQuery.data.length - 1 ? '$16' : '$2'}
                >
                  <Budget
                    data={item}
                    loading={isLoadingMutation(budgetDeleteMutation)}
                    onDelete={() => budgetDeleteMutation.mutate(item.id)}
                    onEdit={() => {
                      navigate({
                        to: Routes.BUDGET_EDIT,
                        params: { id: item.id },
                      });
                    }}
                    onView={() => {
                      navigate({
                        to: Routes.BUDGET_SCHEDULE,
                        params: { id: item.id },
                      });
                    }}
                  />
                </View>
              )}
            />
          </YStack>
        )}

        <TabBatLiquid />

        {budgetsQuery.isSuccess && budgetsQuery.data.length > 0 && (
          <FloatingButtons tabBottom={90}>
            <ActionIcon
              color="green"
              icon={<CalendarPlus color="white" size={22} />}
              onPress={() => {
                navigate({
                  to: Routes.BUDGET_CREATE,
                });
              }}
            />
          </FloatingButtons>
        )}
      </YStack>
    </ConfirmModal>
  );
};

export default Budgets;
