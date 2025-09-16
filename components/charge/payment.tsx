import moment from 'moment';
import { Card, Separator, Text, XStack } from 'tamagui';

import React from 'react';


import TextIcon from '@components/shared/text-icon';
import { Clock, Paperclip } from '@tamagui/lucide-icons';
import { formatCurrency } from '@utils/string';

import type { PaymentType } from '@customTypes/charges';

type PaymentProps = {
  data: PaymentType;
  onDetail: () => void;
};

const Payment = (props: PaymentProps) => {
  const { data, onDetail } = props;

  const dateMoment = moment.unix(data.date);

  return (
    <Card bordered bg="$cardBg" borderRadius="$3" onPress={onDetail}>
      <Card.Header px="$3" py="$2">
        <XStack items="center" justify="space-between" width="100%">
          <XStack gap="$2">
            <Text color="$gray12" fontSize="$textMd">
              {dateMoment.format('DD/MM/YYYY')}
            </Text>
            <TextIcon
              gap="$1.5"
              icon={<Clock color="$gray12" size={15} />}
              text={
                <Text color="$gray12" fontSize="$textMd">
                  {dateMoment.format('HH:mm')}
                </Text>
              }
            />
          </XStack>
          <Text color="$gray12" fontSize="$textMd">
            {formatCurrency(data.amount)}
          </Text>
        </XStack>
      </Card.Header>
      <Separator />
      <Card.Footer px="$3" py="$2.5">
        <XStack items="center" justify="space-between" width="100%">
          <Text color="$gray10" fontSize="$textMd">
            {data.description}
          </Text>
          {data.attachment && <Paperclip color="$gray10" size={18} />}
        </XStack>
      </Card.Footer>
    </Card>
  );
};

export default Payment;
