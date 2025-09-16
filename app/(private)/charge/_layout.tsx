import moment from 'moment';
import { FormProvider, useForm } from 'react-hook-form';

import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@config/screens';
import { ChargeSchema } from '@customTypes/charges';
import { zodResolver } from '@hookform/resolvers/zod';


import type { ChargeType } from '@customTypes/charges';


export default function Layout() {
  const defaultConfig = useStackScreenOptions();

  const methods = useForm<ChargeType>({
    defaultValues: {
      id: '',
      name: '',
      userId: '',
      description: '',
      amount: 0,
      debtors: [],
      deleted: false,
      repeat: {
        type: 'month',
        times: 1,
        isAlways: false,
      },
      startChargeDate: moment().unix(),
    },
    resolver: zodResolver(ChargeSchema),
  });

  return (
    <FormProvider {...methods}>
      <Stack>
        <Stack.Screen name="[id]" options={defaultConfig} />
        <Stack.Screen name="debtor/[id]" options={defaultConfig} />
      </Stack>
    </FormProvider>
  );
}
