import React from 'react';

import * as Notifications from 'expo-notifications';

// import crashlytics from '@react-native-firebase/crashlytics';

import {
  getCrashlytics,
  recordError,
} from '@react-native-firebase/crashlytics';

import { Logger } from './log';

import type { EventBaseType } from '@customTypes/budget';
import type { ChargeType } from '@customTypes/charges';

export const cancelNotification = async (id: string) => {
  await Notifications.cancelScheduledNotificationAsync(id);
};

export const getNotificationSettings = async () => {
  return await Notifications.getPermissionsAsync();
};

export const useCheckNotificationPermission = () => {
  const [settings, setSettings] =
    React.useState<Notifications.NotificationPermissionsStatus | null>(null);

  React.useEffect(() => {
    Notifications.getPermissionsAsync().then((s) => {
      setSettings(s);
    });
  }, []);

  return settings;
};

export const requestNotificationPermission = (skipPreview = false) => {
  Notifications.getPermissionsAsync().then(
    ({ status, granted, canAskAgain }) => {
      if (status !== 'granted' && granted === false && canAskAgain) {
        Logger.warn('Notification permission not granted');
        Notifications.requestPermissionsAsync({
          android: {
            sound: true,
            vibrate: true,
            priority: 'max',
            sticky: false,
          },
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        }).then(({ status: newStatus }) => {
          if (newStatus !== 'granted') {
            Logger.error('Notification permission denied');
          } else if (!skipPreview) {
            scheduleNotification({
              id: 'first-notification',
              title: 'Wahoo!',
              body: 'Now you can receive reminders of your charges and budgets.',
            });
          }
        });
      }
    }
  );
};

export type BudgetDataNotification = {
  entity: 'event';
  data: EventBaseType;
};

export type ChargeDataNotification = {
  entity: 'charge';
  data: ChargeType;
};

export type NotificationParams = {
  id: string;
  title: string;
  body?: string;
  data?: BudgetDataNotification | ChargeDataNotification;
  trigger?: Notifications.NotificationTriggerInput; // number | null;
};

const crashlytics = getCrashlytics();

/**
 * @param  {NotificationParams} params title, body, data, trigger
 * @description params.trigger is a unix timestamp
 * @returns Promise<string> notificationId
 */
export async function scheduleNotification(params: NotificationParams) {
  const { id, title, body, data, trigger } = params;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: trigger || null,
    });

    return notificationId;
  } catch (error) {
    Logger.error('Schedule Notification', trigger, error);

    recordError(
      crashlytics,
      error instanceof Error
        ? error
        : new Error('Error scheduling notification'),
      'scheduleNotification'
    );

    if (process.env.EXPO_PUBLIC_IS_DEV) {
      throw error;
    }
  }
}
