import * as Burnt from 'burnt';
import moment from 'moment';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Stack, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import DebtorSchedule from '@components/charge/debtor-schedule';
import ActionIcon from '@components/shared/action-icon';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import GradientList from '@components/shared/gradient-list';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import Searcher from '@components/shared/searcher';
import { GET_CHARGE_KEY, GET_CHARGE_SCHEDULE_KEY } from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useDebounceState } from '@hooks/input';
import ChargeScheduler from '@model/Charge';
import { Edit3, HelpCircle } from '@tamagui/lucide-icons';
import { useQuery } from '@tanstack/react-query';
import { isLoadingQuery } from '@utils/network';
import { navigate } from '@utils/router';
import { formatCurrency } from '@utils/string';
import { getPeriod } from '@utils/time';

import type {
  ChargeScheduleType,
  ChargeType,
  DebtorScheduleType,
} from '@customTypes/charges';
import type { ScrollView } from 'react-native';

const ChargeView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const refScroll = React.useRef<ScrollView>(null);

  const [query, debouncedQuery, setQuery, debouncing] = useDebounceState(
    '',
    1000
  );

  const chargeDataQuery = useQuery<ChargeType, Error>({
    enabled: !!id,
    queryKey: [GET_CHARGE_KEY, id],
    queryFn: async () => {
      const charge = await DataRepo.chargesService.getCharge(String(id));
      return charge;
    },
  });

  const chargeQuery = useQuery<ChargeScheduleType, Error>({
    enabled: !!chargeDataQuery.data?.id,
    queryKey: [GET_CHARGE_SCHEDULE_KEY, id, chargeDataQuery.data],
    queryFn: () => {
      const chargeSchedule = new ChargeScheduler(
        chargeDataQuery.data as ChargeType
      ).build();
      return chargeSchedule;
    },
  });

  React.useEffect(() => {
    if (chargeQuery.error) {
      Burnt.toast({
        preset: 'error',
        title: 'Error loading charge',
      });
    }
  }, [chargeQuery.error]);

  if (isLoadingQuery(chargeDataQuery, chargeQuery) || !chargeQuery.data) {
    return (
      <YStack bg="$bgApp" height="100%" justify="center">
        <LoaderText text="Loading charge" />
      </YStack>
    );
  }

  const { data } = chargeQuery;

  return (
    <DismissKeyboardHOC>
      <GradientList>
        <YStack gap="$3" height="100%" p="$3">
          <Stack.Screen
            options={{
              headerRight: () => (
                <ActionIcon
                  onlyIcon
                  icon={<Edit3 color="$gray12" size={18} />}
                  variant="icon"
                  onPress={() => {
                    navigate({
                      to: Routes.CHARGE_EDIT,
                      params: { id: data.id },
                    });
                  }}
                />
              ),
            }}
          />
          <YStack gap="$2">
            <Text color="$gray12" fontSize="$textXl" fontWeight="bold">
              {data.name}
            </Text>
            <YStack gap="$1">
              <Text color="$gray11" fontSize="$textMd">
                {data.description}
              </Text>

              <Separator my="$2" />

              <Text color="$gray10" fontSize="$textMd">
                {getPeriod(data.repeat)}. Next charge date{' '}
                {moment.unix(data.nextCharge).format('DD/MM/YYYY')}
              </Text>
              <Text color="$gray10" fontSize="$textMd">
                Charge {formatCurrency(data.amount)}
              </Text>

              <XStack
                content="flex-start"
                items="flex-start"
                justify="space-between"
              >
                <Text color="$gray10" fontSize="$textMd">
                  Total debt {formatCurrency(data.totalDebt)}
                </Text>
                <HelperPopover />
              </XStack>
            </YStack>
          </YStack>

          <Separator my="$2" />

          {Boolean(data.debtors.length) && (
            <Searcher
              loading={debouncing}
              placeholder="Search debtors"
              query={query}
              ref={refScroll}
              onQueryChange={setQuery}
            />
          )}

          <YStack gap="$2">
            {getData(debouncedQuery, data.debtors).map((debtor) => (
              <DebtorSchedule
                chargeId={data.id}
                data={debtor}
                key={debtor.id}
              />
            ))}
          </YStack>

          <View height={48} />
        </YStack>
      </GradientList>
    </DismissKeyboardHOC>
  );

  function getData(q: string, debtors: Array<DebtorScheduleType>) {
    if (!q || query === '') {
      return debtors;
    }
    return debtors.filter((payment) =>
      payment.name.toLowerCase().includes(q.toLowerCase())
    );
  }
};

function HelperPopover() {
  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          <YStack rowGap="$1">
            <Text color="$gray11" fontSize="$textXl" fontWeight="600">
              What are in this section?
            </Text>

            <Separator my="$3" />

            <Text color="$gray11" fontSize="$textMd">
              Here you can se the total amount that you will receive from all
              debtors and see the next charge date, and the amount that will be
              charged to each debtor.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              You can also see quick information of a debtor like the pending
              amount, the last payment date.
            </Text>
            <Text color="$gray11" fontSize="$textMd">
              If you tap on a debtor, you will see more detailed information
              about the debtor like payment history and add, edit or delete it.
            </Text>
          </YStack>
        </GradientList>
      }
    >
      <HelpCircle color="$gray12" size="$1.5" />
    </PopOver>
  );
}

export default ChargeView;
