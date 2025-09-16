import moment from 'moment';
import { Card, Separator, Text, XStack, YStack } from 'tamagui';

import React from 'react';

import TextIcon from '@components/shared/text-icon';
import { Routes } from '@constants/routes';
import { Clock } from '@tamagui/lucide-icons';
import { navigate } from '@utils/router';
import { formatCurrency } from '@utils/string';

import type { DebtorScheduleType } from '@customTypes/charges';
import type { ColorTokens } from 'tamagui';

type ChargeScheduleProps = {
  data: DebtorScheduleType;
  chargeId: string;
};

const DebtorSchedule = (props: ChargeScheduleProps) => {
  const { data } = props;

  const dateMoment = data.lastPaymentDate
    ? moment.unix(data.lastPaymentDate)
    : null;

  const { pendingPayments = 0 } = data;

  return (
    <Card
      bordered
      bg="$cardBg"
      borderRadius="$3"
      onPress={() => {
        navigate({
          to: Routes.DEBTOR_VIEW,
          params: { chargeId: props.chargeId, debtorId: data.id },
        });
      }}
    >
      <Card.Header px="$3" py="$2">
        <XStack content="center" items="center" justify="space-between">
          <Text color="$gray12" fontSize="$textMd">
            {data.name}
          </Text>
          <Text color={getTextColor()} fontSize="$textMd">
            {formatCurrency(data.debt)}
          </Text>
        </XStack>
      </Card.Header>

      <Separator />

      <Card.Footer px="$3" py="$2.5">
        <YStack gap="$1">
          <Text color="$gray10" fontSize="$textSm">
            Pending payments: {data.pendingPayments}
          </Text>
          {dateMoment && (
            <XStack gap="$1.5">
              <Text color="$gray10" fontSize="$textSm">
                Last payment: {dateMoment.format('DD/MM/YYYY')}
              </Text>
              <TextIcon
                gap="$1.5"
                icon={<Clock color="$gray10" size={15} />}
                text={
                  <Text color="$gray10" fontSize="$textSm">
                    {dateMoment.format('HH:mm')}
                  </Text>
                }
              />
            </XStack>
          )}
          {!dateMoment && (
            <Text color="$gray10" fontSize="$textSm">
              No payments made yet
            </Text>
          )}
        </YStack>
      </Card.Footer>
    </Card>
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
};

export default DebtorSchedule;
