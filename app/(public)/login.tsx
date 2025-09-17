import * as Burnt from 'burnt';
import { Controller, useForm } from 'react-hook-form';
import { Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import { Link } from 'expo-router';

import DataRepo from '@api/datasource';
import ButtonCustom from '@components/shared/button';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import InputText from '@components/shared/input-text';
import Logo from '@components/shared/logo';
import QKeys from '@constants/react-api';
import { Routes } from '@constants/routes';
import { LoginSchema } from '@customTypes/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@store/index';
import { Fingerprint, LogIn, ScanEye, ScanFace } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isIOS } from '@utils/platform';
import { navigate } from '@utils/router';

import type { LocalAuthMethodType, LoginType } from '@customTypes/auth';
import type { UserType } from '@customTypes/user';

const Login = () => {
  const queryClient = useQueryClient();

  const { theme, clear, setUser } = useAppStore();

  const localAuthQuery = useQuery<LocalAuthMethodType | null, Error>({
    retry: 1,
    networkMode: 'always',
    queryKey: ['localAuth'],
    queryFn: async () => {
      const hasLocalAuth = await LocalAuthentication.hasHardwareAsync();
      const hasEnrolledAuth =
        (await LocalAuthentication.isEnrolledAsync()) || true;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!hasLocalAuth || !hasEnrolledAuth) return null;

      const method =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (
        method.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        return 'faceId';
      }

      if (method.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      }

      if (method.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }

      return null;
    },
  });

  const loginMutation = useMutation<UserType, Error, LoginType>({
    networkMode: 'always',
    mutationKey: [QKeys.LOGIN_KEY],
    mutationFn: async (data) => {
      const response = await DataRepo.userService.signinWithEmailAndPassword(
        data.email,
        data.password
      );
      queryClient.clear();
      clear();
      return response;
    },
    onSettled: (userData, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'An error occurred',
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

  const loginGoogleMutation = useMutation<UserType, Error>({
    networkMode: 'always',
    mutationKey: [QKeys.LOGIN_GOOGLE_KEY],
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

  const loginIdTokenMutation = useMutation<UserType, Error>({
    networkMode: 'always',
    mutationKey: [QKeys.LOGIN_ID_TOKEN_KEY],
    mutationFn: async () => {
      const response = await DataRepo.userService.signInWithLocalAuth();
      queryClient.clear();
      clear();
      return response;
    },
    onSettled: (userData, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: error.message || 'An error occurred',
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
  } = useForm<LoginType>({
    defaultValues: {
      email: '',
      password: '',
      withGoogle: false,
    },
    resolver: zodResolver(LoginSchema),
  });

  return (
    <DismissKeyboardHOC>
      <YStack height="100%" justify="center">
        <YStack gap="$4" justify="center" p="$6">
          <Logo colored="fy" normal="Song" size="$9" />

          <YStack>
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
                  autoComplete="current-password"
                  error={errors.password?.message}
                  label="Password"
                  textContentType="password"
                  {...field}
                />
              )}
            />

            <XStack gap="$2" mt="$4">
              <ButtonCustom
                color="blue"
                disabled={
                  loginGoogleMutation.isPending && !loginGoogleMutation.isIdle
                }
                loading={loginMutation.isPending && !loginMutation.isIdle}
                text="Sign in with Email"
                variant="filled"
                onPress={handleSubmit((data) => loginMutation.mutate(data))}
              />

              {localAuthQuery.data && (
                <View flexBasis="20%">
                  <ButtonCustom
                    color="blue"
                    disabled={
                      loginIdTokenMutation.isPending &&
                      !loginIdTokenMutation.isIdle
                    }
                    iconLeft={getIcon(localAuthQuery.data)}
                    onPress={loginIdTokenMutation.mutate}
                  />
                </View>
              )}
            </XStack>
          </YStack>

          <YStack gap="$4" mt="$2">
            <ButtonCustom
              color="blue"
              disabled={loginMutation.isPending && !loginMutation.isIdle}
              iconLeft={<LogIn />}
              loading={
                loginGoogleMutation.isPending && !loginGoogleMutation.isIdle
              }
              text="Sign in with Google"
              variant="outline"
              onPress={loginGoogleMutation.mutate}
            />
            {isIOS && (
              <View>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonStyle={
                    theme === 'light'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                      : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
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

          <Text color="$gray10" fontSize="$4" text="center">
            Don&apos;t have an account?{' '}
            <Link href={Routes.REGISTER}>
              <Text color="#339AF0" fontSize="$4" fontWeight="bold">
                Sign up
              </Text>
            </Link>
          </Text>
        </YStack>
      </YStack>
    </DismissKeyboardHOC>
  );

  function getIcon(method: LocalAuthMethodType) {
    switch (method) {
      case 'faceId':
        return <ScanFace size={24} />;
      case 'fingerprint':
        return <Fingerprint size={24} />;
      case 'iris':
        return <ScanEye size={24} />;
      default:
        return <Fingerprint size={24} />;
    }
  }
};

export default Login;
