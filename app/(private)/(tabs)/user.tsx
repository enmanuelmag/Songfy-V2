import * as Burnt from 'burnt';
import { Text, YStack } from 'tamagui';

import React from 'react';

import * as Application from 'expo-application';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';

import DataRepo from '@api/datasource';
import ButtonCustom from '@components/shared/button';
import PopOver from '@components/shared/pop-over';
import SelectCustom from '@components/shared/select';
import SwitchWithLabel from '@components/shared/switch-custom';
import TabBatLiquid from '@components/shared/tab-bar-liquid-glass';
import { CurrencyOptions } from '@constants/currency';
import {
  BIOEMTRIC_AVAILABLE_QUERY,
  BIOMETRIC_SECRET_KEY,
  BIOMETRIC_SECRET_QUERY,
  DELETE_USER,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';
import { LogOut, UserMinus } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isLoadingMutation } from '@utils/network';
import { isIOS } from '@utils/platform';

const Config = () => {
  const queryClient = useQueryClient();

  const { currency, theme, clear, setCurrency, setUser, setTheme } =
    useAppStore();

  const deleteAccountMutation = useMutation<boolean, Error>({
    mutationKey: [DELETE_USER],
    mutationFn: async () => {
      await DataRepo.userService.deleteAccount();
      return true;
    },
    onSettled: (_, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'Error deleting account',
        });
      }
      router.replace(Routes.LOGIN);
      queryClient.clear();
      clear();
      setUser();
    },
  });

  const biometricAvailableQuery = useQuery<boolean, Error>({
    queryKey: [BIOEMTRIC_AVAILABLE_QUERY],
    queryFn: async () => await LocalAuthentication.hasHardwareAsync(),
  });

  const bioemtricSecretQuery = useQuery<boolean, Error>({
    queryKey: [BIOMETRIC_SECRET_QUERY],
    queryFn: async () => await DataRepo.userService.getCheckBiometric(),
  });

  const bioemtricSecretMutation = useMutation<boolean, Error, boolean, boolean>(
    {
      mutationKey: [BIOMETRIC_SECRET_KEY],
      mutationFn: async (value) =>
        await DataRepo.userService.setCheckBiometric(value),
      onSettled: (value, error) => {
        if (error) {
          Burnt.toast({
            preset: 'error',
            title: error.message || 'Error setting biometric',
          });
        }

        queryClient.invalidateQueries({
          refetchType: 'all',
          queryKey: [BIOMETRIC_SECRET_QUERY],
        });

        Burnt.toast({
          title: value ? 'Biometrics enabled' : 'Biometrics disabled',
          preset: 'done',
        });
      },
    }
  );

  return (
    <YStack
      bg="$bgApp"
      height="100%"
      justify="space-between"
      p="$4"
      pb="$12"
      pt="$2"
    >
      <YStack gap="$4" px="$1">
        <SelectCustom
          items={CurrencyOptions.map((c) => ({ name: c.name, id: c.code }))}
          label="Currency"
          placeholder="Select currency"
          value={{ name: currency.name, id: currency.code }}
          onChange={(value) => {
            const currencySelected = CurrencyOptions.find(
              (c) => c.code === value.id
            );
            if (currencySelected) {
              setCurrency(currencySelected);
            }
          }}
        />

        <SwitchWithLabel
          fullWidth
          label="Dark mode"
          name="darkMode"
          value={theme === 'dark'}
          onChange={(value) => setTheme(value ? 'dark' : 'light')}
        />

        {isIOS && Boolean(biometricAvailableQuery.data) && (
          <SwitchWithLabel
            fullWidth
            description="Ask for biometric authentication when opening the app"
            label="Biometric"
            name="biometric"
            value={bioemtricSecretQuery.data}
            onChange={(value) => bioemtricSecretMutation.mutate(value)}
          />
        )}
      </YStack>
      <YStack gap="$3" justify="flex-end">
        <Text color="$gray10" fontSize="$textSm" text="center">
          Version: {Application.nativeApplicationVersion}
        </Text>
        <PopOver
          content={
            <YStack pt="$3">
              <Text color="$gray11" fontSize="$textLg" text="center">
                Are you sure you want to delete your account?
              </Text>
              <Text color="$gray10" fontSize="$textMd" text="center">
                All the data (categories, budgets, charges, etc) will be lost.
                This action is irreversible.
              </Text>
              <YStack gap="$4" mt="$4">
                <ButtonCustom
                  color="red"
                  loading={isLoadingMutation(deleteAccountMutation)}
                  text="Yes, delete account"
                  onPress={() => deleteAccountMutation.mutate()}
                />
                <ButtonCustom color="gray" text="No, cancel" />
              </YStack>
            </YStack>
          }
        >
          <ButtonCustom
            color="red"
            iconLeft={<UserMinus color="white" size="$1" />}
            text="Delete account"
            variant="outline"
          />
        </PopOver>
        <ButtonCustom
          iconLeft={<LogOut size="$1" />}
          text="Logout"
          variant="outline"
          onPress={() => {
            DataRepo.userService.logout().finally(() => {
              router.replace(Routes.LOGIN);
              queryClient.clear();
              clear();
              setUser();
            });
          }}
        />
      </YStack>
      <TabBatLiquid />
    </YStack>
  );
};

export default Config;
