// import EmptySVG from '@assets/charges/empty-charges.svg';

import * as Burnt from 'burnt';
import moment from 'moment';
import { Controller, useForm } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Stack, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import Payment from '@components/charge/payment';
import ActionIcon from '@components/shared/action-icon';
import BottomSheetModal from '@components/shared/bottom-sheet';
import ButtonCustom from '@components/shared/button';
import CurrencyInput from '@components/shared/currency-input';
import DatePickerCustom from '@components/shared/date-picker';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import EmptyState from '@components/shared/empty-state';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import ImagePickerCustom from '@components/shared/image-picker';
import ImagePreview from '@components/shared/image-preivew';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import Searcher from '@components/shared/searcher';
import TextIcon from '@components/shared/text-icon';
import VirtualizedList from '@components/shared/virtualized-list';
import {
  DELETE_DEBTOR_KEY,
  GET_CHARGE_KEY,
  GET_CHARGE_SCHEDULE_KEY,
  GET_DEBTOR_SCHEDULE_KEY,
  UPDATE_CREATE_PAYMENT_KEY,
} from '@constants/reactAPI';
import { PaymentSchema } from '@customTypes/charges';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounceState } from '@hooks/input';
import ChargeScheduler from '@model/Charge';
import { useAppStore } from '@store/index';
import {
  Clock,
  Edit3,
  HelpCircle,
  ListPlus,
  Trash,
} from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingRefetchQuery } from '@utils/network';
import { formatCurrency } from '@utils/string';

import type {
  DebtorScheduleType,
  DebtorType,
  PaymentType,
} from '@customTypes/charges';
import type { ColorTokens } from 'tamagui';

type PopFrom = {
  type: 'add' | 'edit';
  data?: PaymentType;
};

const DebtorView = () => {
  const { chargeId, debtorId } = useLocalSearchParams<{
    chargeId: string;
    debtorId: string;
  }>();

  const [detailItemPopOver, setDetailItemPopOver] =
    React.useState<PaymentType | null>();

  const [payFormPopOver, setPayFormPopOver] = React.useState<PopFrom | null>();

  const [helperPopOver, setHelperPopOver] = React.useState(false);

  const debtorScheduleQuery = useQuery<DebtorScheduleType, Error>({
    enabled: !!chargeId && !!debtorId,
    queryKey: [GET_DEBTOR_SCHEDULE_KEY, chargeId, debtorId],
    queryFn: async () => {
      setDetailItemPopOver(null);
      setPayFormPopOver(null);

      const charge = await DataRepo.chargesService.getCharge(chargeId);

      const chargeSchedule = new ChargeScheduler(charge).build();

      const debtor = chargeSchedule.debtors.find((d) => d.id === debtorId);

      if (!debtor) {
        throw new Error('Debtor not found');
      }

      return debtor;
    },
  });

  const { currency } = useAppStore();

  const [query, debouncedQuery, setQuery, debouncing] = useDebounceState(
    '',
    1000
  );

  const isLoading = isLoadingRefetchQuery(debtorScheduleQuery);

  const pendingPayments = debtorScheduleQuery.data?.pendingPayments ?? 0;

  return (
    <DismissKeyboardHOC>
      <Stack.Screen
        options={{
          headerRight: () => <HelperPopover />,
        }}
      />
      {isLoading && (
        <YStack height="100%" justify="center">
          <LoaderText text="Loading debtor" />
        </YStack>
      )}
      {!isLoading && debtorScheduleQuery.data && (
        <View height="100%">
          <BottomSheetModal
            content={
              <React.Fragment>
                {detailItemPopOver && (
                  <PaymentDetail
                    data={detailItemPopOver}
                    debtorSchedule={debtorScheduleQuery.data}
                    setFormPopOver={(data) => setPayFormPopOver(data)}
                    setPayDetailPopOver={(v) => {
                      if (!v) {
                        setDetailItemPopOver(null);
                      }
                    }}
                  />
                )}

                {payFormPopOver && (
                  <FormPayment
                    currency={currency.symbol}
                    debtorSchedule={debtorScheduleQuery.data}
                    open={Boolean(payFormPopOver)}
                    paymentEdit={payFormPopOver.data}
                    setOpenPopover={(v) => {
                      if (!v) {
                        setPayFormPopOver(null);
                      }
                    }}
                  />
                )}
              </React.Fragment>
            }
            open={Boolean(detailItemPopOver || payFormPopOver || helperPopOver)}
            onOpenChange={(v) => {
              if (!v) {
                detailItemPopOver && setDetailItemPopOver(null);
                payFormPopOver && setPayFormPopOver(null);
                helperPopOver && setHelperPopOver(false);
              }
            }}
          >
            <React.Fragment>
              <YStack height="100%" p="$3">
                <YStack gap="$1">
                  <Text color="$gray12" fontSize="$textXl" fontWeight="bold">
                    {debtorScheduleQuery.data.name}
                  </Text>
                  {debtorScheduleQuery.data.description && (
                    <Text color="$gray10" fontSize="$textMd">
                      {debtorScheduleQuery.data.description}
                    </Text>
                  )}
                  <Text color="$gray10" fontSize="$textMd">
                    Total debt:{' '}
                    <Text color={getTextColor()} fontSize="$textMd">
                      {formatCurrency(debtorScheduleQuery.data.debt)}
                    </Text>
                  </Text>
                  <Text color="$gray10" fontSize="$textMd">
                    Pending payments: {debtorScheduleQuery.data.pendingPayments}
                  </Text>
                </YStack>

                <Separator my="$4" />

                {!debtorScheduleQuery.data.payments.length && (
                  <YStack height="100%" justify="flex-start">
                    <EmptyState text="No payments found">
                      <View mt="$10">
                        <ButtonCustom
                          alignSelf="center"
                          text="Add payment"
                          onPress={() =>
                            setPayFormPopOver({
                              type: 'add',
                            })
                          }
                        />
                      </View>
                    </EmptyState>
                  </YStack>
                )}

                <YStack gap="$4" height="100%">
                  {debtorScheduleQuery.data.payments.length > 0 && (
                    <Searcher
                      loading={debouncing}
                      placeholder="Search payments"
                      query={query}
                      onQueryChange={setQuery}
                    />
                  )}

                  <VirtualizedList
                    initialNumToRender={3}
                    items={getData(
                      debouncedQuery,
                      debtorScheduleQuery.data.payments
                    )}
                    renderItem={({ item: payment }) => (
                      <View mb="$2">
                        <Payment
                          data={payment}
                          onDetail={() => {
                            setDetailItemPopOver(payment);
                          }}
                        />
                      </View>
                    )}
                  />
                </YStack>
              </YStack>

              <View mb={128} />

              {Boolean(debtorScheduleQuery.data.payments.length) && (
                <FloatingButtons>
                  <ActionIcon
                    icon={<ListPlus color="white" size={22} />}
                    onPress={() => {
                      vibration('rigid');
                      setPayFormPopOver({
                        type: 'add',
                        data: undefined,
                      });
                    }}
                  />
                </FloatingButtons>
              )}
            </React.Fragment>
          </BottomSheetModal>
        </View>
      )}
    </DismissKeyboardHOC>
  );

  function getTextColor(): ColorTokens {
    if (pendingPayments >= 2 && pendingPayments < 3) {
      return '$yellow9';
    } else if (pendingPayments >= 3) {
      return '$red9';
    } else {
      return '$green9';
    }
  }

  function getData(q: string, payments: Array<PaymentType>) {
    if (!q || query === '') {
      return payments;
    }
    return payments.filter((payment) =>
      payment.description.toLowerCase().includes(q.toLowerCase())
    );
  }
};

type PaymentDetailProps = {
  data: PaymentType;
  debtorSchedule: DebtorType;
  setPayDetailPopOver: (v: boolean) => void;
  setFormPopOver: (v: PopFrom) => void;
};

function PaymentDetail(props: PaymentDetailProps) {
  const { data, debtorSchedule, setPayDetailPopOver, setFormPopOver } = props;

  const queryClient = useQueryClient();

  const [deletePopOver, setDeletePopOver] = React.useState(false);

  const deletePaymentMutation = useMutation<boolean, Error, string>({
    mutationKey: [DELETE_DEBTOR_KEY],
    mutationFn: async (id: string) => {
      await DataRepo.chargesService.deletePayment({
        debtorId: debtorSchedule.id,
        paymentId: id,
      });

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (q) =>
          [
            GET_CHARGE_SCHEDULE_KEY,
            GET_CHARGE_KEY,
            GET_DEBTOR_SCHEDULE_KEY,
          ].includes(q.queryKey[0] as string),
      });

      return true;
    },
    onSettled: (_, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'Error',
        });
      } else {
        Burnt.toast({
          preset: 'done',
          title: 'Payment deleted',
        });
        setPayDetailPopOver(false);
      }
    },
  });

  const dateMoment = moment.unix(data.date);

  return (
    <YStack mb="$2">
      <XStack gap="$2" items="center" justify="space-between">
        <Text color="$gray12" fontSize="$textXl" fontWeight="bold">
          Payment details
        </Text>
        <XStack gap="$4">
          <ActionIcon
            onlyIcon
            icon={<Edit3 color="$gray12" size={18} />}
            variant="icon"
            onPress={() => {
              vibration();
              setFormPopOver({
                type: 'edit',
                data,
              });
              setPayDetailPopOver(false);
            }}
          />
          <BottomSheetModal
            content={
              <YStack gap="$2">
                <Text color="$gray12" fontSize="$textXl" fontWeight="bold">
                  Delete payment
                </Text>

                <Separator my="$2" />

                <Text color="$gray10" fontSize="$textMd">
                  Are you sure you want to delete{' '}
                  <Text color="$gray11" fontSize="$textMd" fontWeight="bold">
                    {data.description}
                  </Text>{' '}
                  payment?
                </Text>
                <XStack gap="$4" justify="flex-end" mt="$4">
                  <ButtonCustom
                    color="red"
                    loading={
                      deletePaymentMutation.isPending &&
                      !deletePaymentMutation.isIdle
                    }
                    text="Yes, delete"
                    onPress={() => deletePaymentMutation.mutate(data.id)}
                  />
                  <ButtonCustom
                    color="gray"
                    text="No, cancel"
                    onPress={() => setPayDetailPopOver(false)}
                  />
                </XStack>
              </YStack>
            }
            open={deletePopOver}
            onOpenChange={(v) => {
              if (!v) {
                setDeletePopOver(false);
              }
            }}
          >
            <ActionIcon
              onlyIcon
              icon={<Trash color="$red10" size={18} />}
              variant="icon"
              onPress={() => {
                vibration('heavy');
                setDeletePopOver(true);
              }}
            />
          </BottomSheetModal>
        </XStack>
      </XStack>
      <Separator my="$2" />
      <GradientList fromPopOver>
        <YStack gap="$2">
          <Text color="$gray10" fontSize="$textMd">
            {data.description}
          </Text>

          <Text color="$gray10" fontSize="$textMd">
            Amount: {formatCurrency(data.amount)}
          </Text>

          <XStack gap="$2">
            <Text color="$gray10" fontSize="$textMd">
              Date: {dateMoment.format('DD/MM/YYYY')}
            </Text>
            <TextIcon
              gap="$1.5"
              icon={<Clock color="$gray10" size={15} />}
              text={
                <Text color="$gray10" fontSize="$textMd">
                  {dateMoment.format('HH:mm')}
                </Text>
              }
            />
          </XStack>

          {data.attachment && (
            <React.Fragment>
              <Separator my="$2" />

              <ImagePreview
                description={data.description}
                paymentId={data.id}
                url={data.attachment}
              />
            </React.Fragment>
          )}
        </YStack>
      </GradientList>
    </YStack>
  );
}

type FormPaymentProps = {
  open: boolean;
  currency: string;
  paymentEdit?: PaymentType;
  debtorSchedule?: DebtorType;
  setOpenPopover: (v: boolean) => void;
};

const defaultPayment = {
  id: '',
  amount: 0,
  description: '',
  attachment: undefined,
  date: moment().unix(),
  deleted: false,
};

function FormPayment(props: FormPaymentProps) {
  const { currency, paymentEdit, debtorSchedule, setOpenPopover, open } = props;

  const queryClient = useQueryClient();

  const [loadingImage, setLoadingImage] = React.useState(false);

  const formPaymentPopOver = useForm<PaymentType>({
    defaultValues: defaultPayment,
    resolver: zodResolver(PaymentSchema),
  });

  const paymentMutation = useMutation<boolean, Error, PaymentType>({
    mutationKey: [UPDATE_CREATE_PAYMENT_KEY],
    mutationFn: async (payment) => {
      if (!debtorSchedule) {
        Burnt.toast({
          title: 'Missing debtor schedule',
          preset: 'error',
        });
        return false;
      }

      let response = false;

      if (payment.id.length) {
        response = await DataRepo.chargesService.updatePayment({
          paymentId: payment.id,
          payment,
        });
      } else {
        response = await DataRepo.chargesService.addPayment({
          debtorId: debtorSchedule.id,
          payment,
        });
      }

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (q) =>
          [
            GET_CHARGE_KEY,
            GET_CHARGE_SCHEDULE_KEY,
            GET_DEBTOR_SCHEDULE_KEY,
          ].includes(q.queryKey[0] as string),
      });

      return response;
    },
    onSettled: (_, error) => onSettledFunction(true, error),
  });

  React.useEffect(() => {
    if (!open) {
      formPaymentPopOver.reset(defaultPayment);
      return;
    }
    if (paymentEdit) {
      formPaymentPopOver.reset(paymentEdit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentEdit]);

  const idWatch = formPaymentPopOver.watch('id');
  const attachmentWatch = formPaymentPopOver.watch('attachment');

  return (
    <YStack mb="$2">
      <Text color="$gray12" fontSize="$textXl" fontWeight="bold">
        {idWatch.length ? 'Edit payment' : 'Add payment'}
      </Text>
      <Separator my="$4" />
      <GradientList fromPopOver>
        <YStack gap="$3">
          <Controller
            control={formPaymentPopOver.control}
            name="description"
            render={({ field }) => (
              <InputText
                error={formPaymentPopOver.formState.errors.description?.message}
                label="Description"
                placeholder="Enter description"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={formPaymentPopOver.control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput
                error={formPaymentPopOver.formState.errors.amount?.message}
                label="Amount"
                placeholder="0.00"
                symbol={currency}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={formPaymentPopOver.control}
            name="date"
            render={({ field }) => (
              <DatePickerCustom
                isModal
                error={formPaymentPopOver.formState.errors.date?.message}
                mode="date"
                title="Date"
                {...field}
                onConfirm={field.onChange}
              />
            )}
          />

          <View mt="$2">
            <ImagePickerCustom
              color="green"
              loading={loadingImage}
              text={attachmentWatch ? 'Change attachment' : 'Add attachment'}
              value={attachmentWatch}
              onChange={(value) => {
                formPaymentPopOver.setValue('attachment', value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setLoadingImage(false);
              }}
              onPickerOpen={() => setLoadingImage(true)}
              onRemove={() => {
                formPaymentPopOver.setValue('attachment', undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          </View>

          <View mt="$4">
            <ButtonCustom
              color="green"
              disabled={btnDisabled()}
              loading={paymentMutation.isPending && !paymentMutation.isIdle}
              text={idWatch.length ? 'Update payment' : 'Add payment'}
              onPress={() => {
                if (
                  !formPaymentPopOver.formState.isDirty ||
                  paymentMutation.isPending
                ) {
                  return;
                }
                formPaymentPopOver.handleSubmit((data) =>
                  paymentMutation.mutate(data)
                )();
              }}
            />
          </View>
        </YStack>
      </GradientList>
    </YStack>
  );

  function btnDisabled() {
    return (
      !formPaymentPopOver.formState.isDirty ||
      !isEmpty(formPaymentPopOver.formState.errors)
    );
  }

  function onSettledFunction(changed?: boolean | null, error?: Error | null) {
    if (error) {
      Burnt.toast({
        preset: 'error',
        title: error.message || 'Error creating payment',
      });
    }
    if (changed) {
      Burnt.toast({
        preset: 'done',
        title: 'Payment added',
      });
    }
    setOpenPopover(false);
    formPaymentPopOver.reset(defaultPayment);
  }
}

function HelperPopover() {
  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          <YStack rowGap="$1">
            <Text color="$gray12" fontSize="$textXl" fontWeight="600">
              What are payments?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              In this section you can see all the payments that you have made to
              this debtor. Each payment has a description, amount, date, and an
              optional attachment.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              You can add a new payment by taping the green button at the bottom
              right of the screen.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              You can also see details of a payment by taping on it and delete
              it by taping on the trash icon.
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

export default DebtorView;
