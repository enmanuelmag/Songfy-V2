// import EmptySVG from '@assets/charges/empty-charges.svg';

import * as Burnt from 'burnt';
import { View, XStack, YStack } from 'tamagui';

import React from 'react';

import DataRepo from '@api/datasource';
import Charge from '@components/charge/charge';
import ActionIcon from '@components/shared/action-icon';
import ButtonCustom from '@components/shared/button';
import EmptyState from '@components/shared/empty-state';
import FlatGradientList from '@components/shared/flat-gradient-list';
import FloatingButtons from '@components/shared/floating-buttons';
import LoaderText from '@components/shared/loader-text';
import TabBatLiquid from '@components/shared/tab-bar-liquid-glass';
import {
  CHARGES_ENTITY,
  CHARGE_ENTITY,
  DEBTOR_ENTITY,
  DELETE_CHARGE_KEY,
  LIST_CHARGES_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { ListPlus } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isLoadingMutation, isLoadingQuery } from '@utils/network';
import { navigate } from '@utils/router';

import type { ChargeType } from '@customTypes/charges';

const Charges = () => {
  const queryClient = useQueryClient();

  const chargesQuery = useQuery<Array<ChargeType>, Error>({
    queryKey: [LIST_CHARGES_KEY],
    queryFn: async () => await DataRepo.chargesService.getCharges(),
  });

  const [localRefresh, setLocalRefresh] = React.useState(false);

  const chargeDeleteMutation = useMutation<boolean, Error, string>({
    mutationKey: [DELETE_CHARGE_KEY],
    mutationFn: async (id: string) => {
      const response = await DataRepo.chargesService.deleteCharge(id);

      queryClient.invalidateQueries({
        refetchType: 'all',
        queryKey: [LIST_CHARGES_KEY],
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
          title: error.message || 'Error deleting budget',
          preset: 'error',
        });
      }
    },
  });

  const isLoading =
    isLoadingQuery(chargesQuery) || isLoadingMutation(chargeDeleteMutation);

  return (
    <YStack bg="$bgApp" height="100%" width="100%">
      {isLoading && (
        <YStack height="100%" justify="center">
          <LoaderText text="Loading charges" />
        </YStack>
      )}

      {chargesQuery.isSuccess && chargesQuery.data.length === 0 && (
        <YStack height="100%" items="center" justify="center">
          <EmptyState text="No charges found">
            <XStack justify="center" minW={200} mt="$4">
              <ButtonCustom
                text="Create a charge"
                onPress={() => {
                  navigate({
                    to: Routes.CHARGE_CREATE,
                  });
                }}
              />
            </XStack>
          </EmptyState>
        </YStack>
      )}

      {chargesQuery.isSuccess && Boolean(chargesQuery.data.length) && (
        <YStack gap="$2" justify="flex-start" pt="$2" px="$3">
          <FlatGradientList
            isRefetching={chargesQuery.isFetching || localRefresh}
            items={chargesQuery.data}
            refetch={() => {
              setLocalRefresh(true);
              queryClient
                .invalidateQueries({
                  type: 'all',
                  refetchType: 'all',
                  predicate: (query) =>
                    [CHARGE_ENTITY, CHARGES_ENTITY, DEBTOR_ENTITY].some((e) =>
                      query.queryKey.includes(e)
                    ),
                })
                .finally(() => {
                  chargesQuery.refetch();
                  setLocalRefresh(false);
                });
            }}
            renderItem={({ item: charge, index }) => (
              <View mb={index === chargesQuery.data.length - 1 ? '$16' : '$2'}>
                <Charge
                  data={charge}
                  key={charge.id}
                  onDelete={() => chargeDeleteMutation.mutate(charge.id)}
                  onEdit={() => {
                    navigate({
                      to: Routes.CHARGE_EDIT,
                      params: { id: charge.id },
                    });
                  }}
                  onView={() => {
                    navigate({
                      to: Routes.CHARGE_VIEW,
                      params: { id: charge.id },
                    });
                  }}
                />
              </View>
            )}
          />
        </YStack>
      )}

      <TabBatLiquid />

      {chargesQuery.isSuccess && chargesQuery.data.length > 0 && (
        <FloatingButtons tabBottom={90}>
          <ActionIcon
            color="green"
            icon={<ListPlus color="white" size={22} />}
            onPress={() => {
              navigate({
                to: Routes.CHARGE_CREATE,
              });
            }}
          />
        </FloatingButtons>
      )}
    </YStack>
  );
};

export default Charges;
