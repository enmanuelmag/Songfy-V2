import moment from 'moment';
import { FormProvider, useForm } from 'react-hook-form';

import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@config/screens';
import { BudgetExtendedSchema } from '@customTypes/budget';
import { zodResolver } from '@hookform/resolvers/zod';

export default function Layout() {
  const defaultConfig = useStackScreenOptions();

  const methods = useForm({
    defaultValues: {
      id: '',
      name: '',
      userId: '',
      deleted: false,
      description: '',
      initialBalance: 0,
      startDate: moment().unix(),
      endMonths: 3,
      events: [],
      eventsArchived: [],
    },
    resolver: zodResolver(BudgetExtendedSchema),
  });

  return (
    <FormProvider {...methods}>
      <Stack>
        <Stack.Screen name="[id]" options={defaultConfig} />
        <Stack.Screen name="email" options={defaultConfig} />
        {/* <Stack.Screen name="event" options={defaultConfig} /> */}
        <Stack.Screen name="event/[id]" options={defaultConfig} />
      </Stack>
    </FormProvider>
  );
}
