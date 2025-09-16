import * as Burnt from 'burnt';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { Text, YStack } from 'tamagui';
import { v4 as uuidv4 } from 'uuid';

import React from 'react';

import { Stack, router, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import ActionIcon from '@components/shared/action-icon';
import CurrencyInputCustom from '@components/shared/currency-input';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import {
  GET_CHARGE_KEY,
  GET_CHARGE_SCHEDULE_KEY,
  GET_DEBTOR_KEY,
  GET_DEBTOR_SCHEDULE_KEY,
  UPDATE_CREATE_DEBTOR_KEY,
} from '@constants/reactAPI';
import { DebtorSchema } from '@customTypes/charges';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from '@tamagui/lucide-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';
import { formatCurrency } from '@utils/string';

import type { ChargeType, DebtorType } from '@customTypes/charges';

const DebtorCreate = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const mode = id && id !== 'no-id' ? 'edit' : 'create';

  const formNested = useFormContext<ChargeType>();

  const debtorEditQuery = useQuery<DebtorType, Error>({
    enabled: mode === 'edit',
    queryKey: [GET_DEBTOR_KEY, id],
    queryFn: () => {
      const debtor = formNested.getValues('debtors').find((e) => e.id === id);

      if (!debtor) {
        throw new Error('Debtor not found');
      }

      return debtor;
    },
  });

  const formDebtorCU = useForm<DebtorType>({
    defaultValues: debtorEditQuery.data ?? {
      id: uuidv4(),
      name: '',
      description: '',
      factor: 1,
      deleted: false,
      payments: [],
    },
    resolver: zodResolver(DebtorSchema),
  });

  React.useEffect(() => {
    if (id && debtorEditQuery.data) {
      formDebtorCU.reset(debtorEditQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtorEditQuery.data, id]);

  const debtorMutation = useMutation<DebtorType, Error, DebtorType>({
    mutationKey: [UPDATE_CREATE_DEBTOR_KEY],
    mutationFn: async (debtor) => {
      const debtorsForm = formNested.getValues('debtors');
      if (mode === 'edit' && debtorEditQuery.data) {
        await DataRepo.chargesService.updateDebtor({
          debtorId: debtorEditQuery.data.id || '',
          debtor: debtor,
        });

        formNested.setValue(
          'debtors',
          debtorsForm.map((d) => (d.id === debtor.id ? debtor : d)),
          {
            shouldDirty: true,
            shouldValidate: true,
          }
        );
      } else {
        const chargeId = formNested.getValues('id');
        if (chargeId.length) {
          await DataRepo.chargesService.addDebtor({
            chargeId,
            debtor: debtor,
          });
        }

        formNested.setValue('debtors', [...debtorsForm, debtor], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [
            GET_CHARGE_KEY,
            GET_CHARGE_SCHEDULE_KEY,
            GET_DEBTOR_SCHEDULE_KEY,
          ].includes(query.queryKey[0] as string),
      });

      return debtor;
    },
    onSettled: (debtorData, error) =>
      onSettledFunction(true, debtorData, error),
  });

  const isDisabled = btnDisabled();

  const isLoading = isLoadingRefetchQuery(debtorEditQuery);

  return (
    <DismissKeyboardHOC>
      <YStack
        bg="$bgApp"
        height="100%"
        justify="space-between"
        p="$3"
        width="100%"
      >
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$textLg">
                {mode === 'create' ? 'Create debtor' : 'Edit debtor'}
              </Text>
            ),
          }}
        />

        {isLoading && (
          <YStack height="100%" justify="center">
            <LoaderText text="Loading debtor" />
          </YStack>
        )}

        {!isLoading && (
          <React.Fragment>
            <GradientList>
              <YStack gap="$3">
                <Controller
                  control={formDebtorCU.control}
                  name="name"
                  render={({ field }) => (
                    <InputText
                      error={formDebtorCU.formState.errors.name?.message}
                      label="Name"
                      placeholder="Charge name"
                      {...field}
                    />
                  )}
                />
                <Controller
                  control={formDebtorCU.control}
                  name="description"
                  render={({ field }) => (
                    <InputText
                      error={formDebtorCU.formState.errors.description?.message}
                      label="Description"
                      placeholder="Charge description"
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={formDebtorCU.control}
                  name="factor"
                  render={({ field }) => (
                    <CurrencyInputCustom
                      delimiter=""
                      description="Used to calculate payment amount, you can use decimals."
                      error={formDebtorCU.formState.errors.factor?.message}
                      label="Factor"
                      placeholder="Type the factor"
                      precision={2}
                      separator="."
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Text color="$gray11" fontSize="$textMd">
                  The charge amount will be:{' '}
                  <Text color="$gray12" fontSize="$textMd" fontWeight="600">
                    {formatCurrency(
                      (formDebtorCU.watch('factor') || 0) *
                        (formNested.getValues('amount') || 0)
                    )}
                  </Text>
                </Text>
              </YStack>
            </GradientList>

            <FloatingButtons>
              <ActionIcon
                disabled={isDisabled}
                icon={
                  <Save color={isDisabled ? '$gray10' : 'white'} size={22} />
                }
                loading={debtorMutation.isPending && !debtorMutation.isIdle}
                onPress={() => {
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  if (formDebtorCU.formState.touchedFields) {
                    vibration('rigid');
                    formDebtorCU.handleSubmit((d) =>
                      debtorMutation.mutate(d)
                    )();
                  } else {
                    vibration('medium');
                    onSettledFunction(false, null, null);
                  }
                }}
              />
            </FloatingButtons>
          </React.Fragment>
        )}
      </YStack>
    </DismissKeyboardHOC>
  );

  function btnDisabled() {
    return (
      !formDebtorCU.formState.isDirty || !isEmpty(formDebtorCU.formState.errors)
    );
  }

  function onSettledFunction(
    changed?: boolean | null,
    debtorData?: DebtorType | null,
    error?: Error | null
  ) {
    if (error) {
      Burnt.toast({
        preset: 'error',
        title: 'Error creating debtor',
      });
      return;
    }
    if (changed && debtorData) {
      queryClient.invalidateQueries({
        exact: true,
        refetchType: 'all',
        queryKey: [GET_DEBTOR_KEY, id],
      });

      if (mode === 'edit') {
        Burnt.toast({
          title: 'Debtor updated',
          preset: 'done',
        });
      } else {
        Burnt.toast({
          preset: 'done',
          title: 'Debtor created',
        });
      }
    }

    formDebtorCU.reset();
    router.back();
  }
};

export default DebtorCreate;
