import moment from 'moment';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CurrencyOptions } from '@constants/currency';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrencyType } from '@constants/currency';
import type { UserType } from '@customTypes/user';
import type { NotificationPermissionsStatus } from 'expo-notifications';

type ThemeOptions = 'light' | 'dark';

type UserSlice = {
  // states
  user: UserType | null;
  theme: ThemeOptions;
  usedSystemTheme: boolean;
  currency: CurrencyType;
  lastCheckUpdate: number | null;
  activeTimestamp: number | null;
  backgroundTimestamp: number | null;
  notificationSettings: NotificationPermissionsStatus | null;
  // actions
  clear: () => void;
  setRequiredBiometric: (requiredBiometric: boolean) => void;
  setUsedSystemTheme: (usedSystemTheme: boolean) => void;
  setLastCheckUpdate: (lastCheckUpdate: number) => void;
  setUser: (user?: UserType | null) => void;
  setTheme: (theme: ThemeOptions) => void;
  setCurrency: (currency: CurrencyType) => void;
  setNotificationSettings: (
    notificationSettings: NotificationPermissionsStatus | null
  ) => void;
};

type BudgetSlice = {
  // states
  // Budget form
  // Charge
  // transversal actions
  clear: () => void;
};

const initialUserSlice = {
  user: null,
  theme: 'light' as ThemeOptions,
  usedSystemTheme: false,
  activeTimestamp: null,
  lastCheckUpdate: null,
  backgroundTimestamp: null,
  notificationSettings: null,
  currency: CurrencyOptions[0],
};

const initialBudgetSlice = {};

export const useAppStore = create(
  persist<UserSlice & BudgetSlice>(
    (set) => ({
      ...initialUserSlice,
      ...initialBudgetSlice,
      // User actions
      setUser: (user) => set({ user }),
      setRequiredBiometric: (requiredBiometric) =>
        set((prev) => {
          if (requiredBiometric) {
            return { ...prev, backgroundTimestamp: moment().unix() };
          }
          return { ...prev, activeTimestamp: moment().unix() };
        }),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setLastCheckUpdate: (lastCheckUpdate) => set({ lastCheckUpdate }),
      setUsedSystemTheme: (usedSystemTheme) => set({ usedSystemTheme }),
      setNotificationSettings: (notificationSettings) =>
        set({ notificationSettings }),
      // Budget actions
      // Transversal actions
      clear: () =>
        set((state) => ({
          ...initialUserSlice,
          ...initialBudgetSlice,
          theme: state.theme,
        })),
    }),
    {
      version: 6,
      name: 'app-budgetfy-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
