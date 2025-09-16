import { Text, YStack } from 'tamagui';

import React, { Component } from 'react';

import {
  getCrashlytics,
  recordError,
} from '@react-native-firebase/crashlytics';
import { Logger } from '@utils/log';


import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

const crashlytics = getCrashlytics();

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('Uncaught error:', error, errorInfo);

    this.setState({ hasError: true });
    recordError(crashlytics, error, error.name);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <YStack gap="$4" height="100%" justify="center" p="$6" width="100%">
          <Text
            color="$gray12"
            fontSize="$textLg"
            fontWeight="600"
            text="center"
          >
            Something went wrong
          </Text>
          <Text color="$gray10" fontSize="$textMd" text="center">
            Our team has been notified, please restart the app
          </Text>
        </YStack>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
