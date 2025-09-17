import * as Burnt from 'burnt';
import { Controller, useForm } from 'react-hook-form';
import { Separator, Text, View, YStack } from 'tamagui';

import React from 'react';

import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';

import DataRepo from '@api/datasource';
import ButtonCustom from '@components/shared/button';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import InputText from '@components/shared/input-text';
import Logo from '@components/shared/logo';
import QKeys from '@constants/react-api';
import { Routes } from '@constants/routes';
import { RegisterSchema } from '@customTypes/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@store/index';
import { LogIn } from '@tamagui/lucide-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isLoadingMutation } from '@utils/network';
import { isIOS } from '@utils/platform';
import { navigate } from '@utils/router';

import type { RegisterType } from '@customTypes/auth';
import type { UserType } from '@customTypes/user';

const Register = () => {
  const queryClient = useQueryClient();

  const { theme, clear, setUser } = useAppStore();

  const registerMutation = useMutation<UserType, Error, RegisterType>({
    networkMode: 'always',
    mutationKey: [QKeys.REGISTER_KEY],
    mutationFn: async (data) => {
      const response = await DataRepo.userService.signUpWithEmailAndPassword(
        data.email,
        data.password
      );
      queryClient.clear();
      clear();
      return response;
    },
    onSettled: (userData, error) => {
      if (error || !userData) {
        Burnt.toast({
          preset: 'error',
          title: error?.message || 'An error occurred',
        });
      }
      if (userData) {
        setUser(userData);
        navigate({
          to: Routes.SEARCH,
        });
      }
    },
  });

  const registerGoogleMutation = useMutation<UserType, Error>({
    networkMode: 'always',
    mutationKey: [QKeys.REGISTER_GOOGLE_KEY],
    mutationFn: async () => {
      const response = await DataRepo.userService.signinWithGoogle();
      queryClient.clear();
      clear();
      return response;
    },
    onSettled: (userData, error) => {
      if (error || !userData) {
        Burnt.toast({
          preset: 'error',
          title: error?.message || 'An error occurred',
        });
      }
      if (userData) {
        setUser(userData);
        navigate({
          to: Routes.SEARCH,
        });
      }
    },
  });

  const loginAppleMutation = useMutation<UserType | null, Error>({
    networkMode: 'always',
    mutationKey: [QKeys.LOGIN_APPLE_KEY],
    mutationFn: async () => {
      const response = await DataRepo.userService.signinWithApple();
      queryClient.clear();
      clear();
      return response;
    },
    onSettled: (userData, error) => {
      if (error || !userData) {
        Burnt.toast({
          preset: 'error',
          title: error?.message || 'An error occurred',
        });
      }
      if (userData) {
        setUser(userData);
        navigate({
          to: Routes.SEARCH,
        });
      }
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterType>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      withGoogle: false,
    },
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <DismissKeyboardHOC>
      <YStack height="100%" justify="center">
        <YStack gap="$4" p="$6">
          <Logo colored="fy" normal="Song" size="$9" />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <InputText
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                keyboardType="email-address"
                label="Email"
                textContentType="emailAddress"
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <InputText
                isPassword
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.password?.message}
                label="Password"
                textContentType="newPassword"
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <InputText
                isPassword
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.password?.message}
                label="Confirm password"
                textContentType="newPassword"
                {...field}
              />
            )}
          />

          <ButtonCustom
            disabled={isLoadingMutation(
              registerMutation,
              registerGoogleMutation
            )}
            loading={isLoadingMutation(registerGoogleMutation)}
            text="Sign up with Email"
            onPress={handleSubmit((data) => registerMutation.mutate(data))}
          />
          <YStack gap="$2.5" mt="$2">
            <View>
              <ButtonCustom
                color="blue"
                disabled={
                  registerGoogleMutation.isPending &&
                  !registerGoogleMutation.isIdle
                }
                iconLeft={<LogIn />}
                loading={
                  registerGoogleMutation.isPending &&
                  !registerGoogleMutation.isIdle
                }
                text="Sign up with Google"
                variant="outline"
                onPress={registerGoogleMutation.mutate}
              />
            </View>
            {isIOS && (
              <View grow={1}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonStyle={
                    theme === 'light'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                      : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  }
                  cornerRadius={8}
                  style={{
                    width: '100%',
                    height: 40,
                  }}
                  onPress={loginAppleMutation.mutate}
                />
              </View>
            )}
          </YStack>
          <Separator mt="$2" />
          <Text color="$gray10" text="center">
            Already have an account? <Link href={Routes.LOGIN}>Sign in</Link>
          </Text>
        </YStack>
      </YStack>
    </DismissKeyboardHOC>
  );
};

export default Register;
