import * as Burnt from 'burnt';
import moment from 'moment';
import { Controller, useFormContext } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';
import { v4 as uuidv4 } from 'uuid';

import React from 'react';

import { Stack, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import Debtor from '@components/charge/debt';
import ActionIcon from '@components/shared/action-icon';
import CurrencyInputCustom from '@components/shared/currency-input';
import DatePickerCustom from '@components/shared/date-picker';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import Searcher from '@components/shared/searcher';
import SelectCustom from '@components/shared/select';
import SwitchWithLabel from '@components/shared/switch-custom';
import { RepeatChargeOptions } from '@constants/budget';
import {
  CREATE_UPDATE_CHARGE_KEY,
  GET_CHARGE_KEY,
  GET_CHARGE_SCHEDULE_KEY,
  GET_DEBTOR_SCHEDULE_KEY,
  LIST_CHARGES_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useDebounceState } from '@hooks/input';
import { useAppStore } from '@store/index';
import { HelpCircle, Save, UserPlus2 } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingQuery } from '@utils/network';
import { navigate } from '@utils/router';

import type { RepeatType } from '@customTypes/budget';
import type { ChargeType, DebtorType } from '@customTypes/charges';
import type { ScrollView } from 'react-native';

const Charge = () => {
  const queryClient = useQueryClient();
  const { currency } = useAppStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const mode = id ? 'edit' : 'create';

  const refScroll = React.useRef<ScrollView>(null);

  const chargeEditQuery = useQuery<ChargeType, Error>({
    enabled: mode === 'edit',
    queryKey: [GET_CHARGE_KEY, id],
    queryFn: async () => {
      const charge = await DataRepo.chargesService.getCharge(String(id));
      return charge;
    },
  });

  const [query, debouncedQuery, setQuery, debouncing] = useDebounceState(
    '',
    1000
  );

  const formChargeCU = useFormContext<ChargeType>();

  React.useEffect(() => {
    if (mode === 'create') {
      formChargeCU.setValue('id', uuidv4());
      formChargeCU.setValue('startChargeDate', moment().unix());
    } else if (chargeEditQuery.data) {
      formChargeCU.reset(chargeEditQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chargeEditQuery.isSuccess, mode]);

  const createChargeMutation = useMutation<
    ChargeType | boolean,
    Error,
    ChargeType
  >({
    networkMode: 'always',
    mutationKey: [CREATE_UPDATE_CHARGE_KEY],
    mutationFn: async (data) => {
      let response: ChargeType | boolean = false;
      if (mode === 'create') {
        response = await DataRepo.chargesService.createCharge(data);
      } else {
        response = await DataRepo.chargesService.updateCharge(String(id), data);
      }

      return response;
    },
    onSettled: (_, error) => onSettleFunction(true, error),
  });

  if (isLoadingQuery(chargeEditQuery)) {
    return (
      <YStack bg="$bgApp" height="100%" justify="center">
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$textLg">
                {mode === 'create' ? 'Create charge' : 'Edit charge'}
              </Text>
            ),
          }}
        />
        <LoaderText text="Loading charge" />
      </YStack>
    );
  }

  const repeatWatch = formChargeCU.watch('repeat');

  const debtorsWatch = formChargeCU.watch('debtors');

  const btnDisabledValue = btnDisabled();

  return (
    <DismissKeyboardHOC>
      <View height="100%" width="100%">
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$textLg">
                {mode === 'create' ? 'Create charge' : 'Edit charge'}
              </Text>
            ),
            headerRight: () => <HelperPopover />,
          }}
        />

        <GradientList ref={refScroll}>
          <YStack gap="$3" height="100%" p="$3" onPress={() => null}>
            <Controller
              control={formChargeCU.control}
              name="name"
              render={({ field }) => (
                <InputText
                  error={formChargeCU.formState.errors.name?.message}
                  label="Name"
                  placeholder="Charge name"
                  {...field}
                />
              )}
            />
            <Controller
              control={formChargeCU.control}
              name="description"
              render={({ field }) => (
                <InputText
                  error={formChargeCU.formState.errors.description?.message}
                  label="Description"
                  placeholder="Charge description"
                  {...field}
                />
              )}
            />

            <XStack onPress={() => null}>
              <View flexBasis="50%" pr="$1.5">
                <Controller
                  control={formChargeCU.control}
                  name="amount"
                  render={({ field }) => (
                    <CurrencyInputCustom
                      error={formChargeCU.formState.errors.amount?.message}
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
                  control={formChargeCU.control}
                  name="startChargeDate"
                  render={({ field }) => (
                    <DatePickerCustom
                      isModal
                      error={
                        formChargeCU.formState.errors.startChargeDate?.message
                      }
                      mode="date"
                      title="Start date"
                      {...field}
                      onConfirm={field.onChange}
                    />
                  )}
                />
              </View>
            </XStack>

            <XStack onPress={() => null}>
              <View flexBasis="50%" justify="center" pl="$1">
                <Controller
                  control={formChargeCU.control}
                  name="repeat.isAlways"
                  render={({ field }) => (
                    <SwitchWithLabel
                      disabled={repeatWatch.type === 'unique'}
                      label="Always"
                      {...field}
                      value={Boolean(field.value)}
                      onChange={(v) =>
                        formChargeCU.setValue('repeat.isAlways', v, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  )}
                />
              </View>
              <View
                flexBasis="50%"
                justify="center"
                pr="$1"
                onPress={() => null}
              >
                {!repeatWatch.isAlways && (
                  <Controller
                    control={formChargeCU.control}
                    name="repeat.times"
                    render={({ field }) => (
                      <InputText
                        disabled={formChargeCU.watch('repeat.isAlways')}
                        error={
                          formChargeCU.formState.errors.repeat?.times?.message
                        }
                        keyboardType="numeric"
                        label="Times"
                        placeholder="Times"
                        readOnly={formChargeCU.watch('repeat.isAlways')}
                        {...field}
                        onChange={(v) =>
                          formChargeCU.setValue('repeat.times', Number(v), {
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

            <Controller
              control={formChargeCU.control}
              name="repeat.type"
              render={({ field }) => (
                <SelectCustom
                  defaultValue={RepeatChargeOptions[1]}
                  items={RepeatChargeOptions}
                  label="Type"
                  placeholder="Select type"
                  {...field}
                  value={RepeatChargeOptions.find(
                    (c) => c.id === repeatWatch.type
                  )}
                  onChange={(eventType) => {
                    const typeSelected = RepeatChargeOptions.find(
                      (c) => c.id === eventType.id
                    );
                    if (typeSelected)
                      formChargeCU.setValue(
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

            <Separator mt="$1" />

            {Boolean(debtorsWatch.length) && (
              <Searcher
                loading={debouncing}
                placeholder="Search debtors"
                query={query}
                ref={refScroll}
                onQueryChange={setQuery}
              />
            )}

            {Boolean(debtorsWatch.length) && (
              <YStack gap="$2">
                {getData(debouncedQuery, debtorsWatch).map((debtor, index) => (
                  <Debtor
                    data={debtor}
                    key={index}
                    onDelete={() => {
                      formChargeCU.setValue(
                        'debtors',
                        debtorsWatch.filter((_, i) => i !== index),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      );
                    }}
                    onEdit={() => {
                      navigate({
                        to: Routes.DEBTOR_CREATE_MODAL,
                        params: { id: debtor.id },
                      });
                    }}
                  />
                ))}
              </YStack>
            )}
            {!debtorsWatch.length && (
              <YStack gap="$2" justify="center" mt="$8" px="$6">
                <Text color="$gray10" fontSize="$textMd" text="center">
                  Add debtors to the charge. At least one debtor is required
                </Text>
              </YStack>
            )}
          </YStack>

          <View height={200} />
        </GradientList>

        <FloatingButtons>
          <ActionIcon
            icon={<UserPlus2 color="white" size={22} />}
            onPress={() => {
              navigate({
                to: Routes.DEBTOR_CREATE_MODAL,
                params: { id: 'no-id' },
              });
            }}
          />
          <ActionIcon
            color="green"
            disabled={btnDisabledValue}
            icon={
              <Save color={btnDisabledValue ? '$gray9' : 'white'} size={22} />
            }
            loading={
              createChargeMutation.isPending && !createChargeMutation.isIdle
            }
            onPress={() => {
              if (debtorsWatch.length === 0) {
                Burnt.toast({
                  preset: 'error',
                  title: 'At least one debtor is required',
                });
              }

              if (formChargeCU.formState.isDirty) {
                vibration('rigid');
                formChargeCU.handleSubmit((data) =>
                  createChargeMutation.mutate(data)
                )();
              } else {
                vibration('medium');
                onSettleFunction(false, null);
              }
            }}
          />
        </FloatingButtons>
      </View>
    </DismissKeyboardHOC>
  );

  function getData(q: string, debtors: Array<DebtorType>) {
    if (!q || query === '') {
      return debtors;
    }
    return debtors.filter((payment) =>
      payment.name.toLowerCase().includes(q.toLowerCase())
    );
  }

  function btnDisabled() {
    return (
      !formChargeCU.formState.isDirty || !isEmpty(formChargeCU.formState.errors)
    );
  }

  async function onSettleFunction(changed: boolean, error?: Error | null) {
    if (error) {
      Burnt.toast({
        preset: 'error',
        title: error.message || 'Error creating charge',
      });
      return;
    }
    formChargeCU.reset();
    navigate({
      to: Routes.CHARGES,
    });

    if (changed) {
      Burnt.toast({
        preset: 'done',
        title: `Budget ${mode === 'create' ? 'created' : 'updated'}`,
      });

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (q) =>
          [
            LIST_CHARGES_KEY,
            GET_CHARGE_KEY,
            GET_CHARGE_SCHEDULE_KEY,
            GET_DEBTOR_SCHEDULE_KEY,
          ].includes(q.queryKey[0] as string),
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
              What is a Charge and how to use it?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              A charge is a way of defining the collections you have with a
              group of people.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              A Charge has a name, description, amount (how much you will
              collect to each debtor), a start date and a repeat type.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              Finally, a debtor is a person that you will collect the amount
              defined in the charge. You can define a name, description, and an
              factor to multiply the amount.
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

export default Charge;
