import { Text } from 'tamagui';

import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@config/screens';

export default function Layout() {
  const chargeConfig = useStackScreenOptions({
    headerTitle: (
      <Text color="$primary" fontSize="$textLg">
        Charge
      </Text>
    ),
  });

  const debtorConfig = useStackScreenOptions({
    headerTitle: (
      <Text color="$primary" fontSize="$textLg">
        Debtor
      </Text>
    ),
  });

  return (
    <Stack>
      <Stack.Screen name="[id]" options={chargeConfig} />
      <Stack.Screen name="[chargeId]/[debtorId]" options={debtorConfig} />
    </Stack>
  );
}
