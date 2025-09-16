import React from 'react';

import { Tabs } from 'expo-router';

import DataRepo from '@api/datasource';
import Logo from '@components/shared/logo';
import { useTabsScreenOptions } from '@config/screens';
import {
  LIST_BUDGET_KEY,
  LIST_CATEGORY_KEY,
  LIST_CHARGES_KEY,
} from '@constants/reactAPI';
import { Calendar, ListChecks, Tags, UserCircle } from '@tamagui/lucide-icons';
import { useQuery } from '@tanstack/react-query';
import { vibration } from '@utils/haptics';
import { isAndroid, isIPad } from '@utils/platform';



import type { BudgetBaseType, CategoryType } from '@customTypes/budget';
import type { ChargeType } from '@customTypes/charges';

export default function TabLayout() {
  const categoriesTabConfig = useTabsScreenOptions({
    title: 'Categories',
    headerTitle: <Logo colored="ries" normal="Catego" size="$text2Xl" />,
    Icon: Tags,
  });

  const budgetsTabConfig = useTabsScreenOptions({
    title: 'Budgets',
    headerTitle: <Logo colored="gets" normal="Bud" size="$text2Xl" />,
    Icon: Calendar,
  });

  const chargesTabConfig = useTabsScreenOptions({
    title: 'Charges',
    headerTitle: <Logo colored="ges" normal="Char" size="$text2Xl" />,
    Icon: ListChecks,
  });

  const userTabConfig = useTabsScreenOptions({
    title: 'User',
    headerTitle: <Logo colored="ser" normal="U" size="$text2Xl" />,
    Icon: UserCircle,
  });

  useQuery<Array<BudgetBaseType>, Error>({
    networkMode: 'always',
    queryKey: [LIST_BUDGET_KEY],
    queryFn: async () => await DataRepo.budgetsService.getBudgets(),
  });

  useQuery<Array<ChargeType>, Error>({
    queryKey: [LIST_CHARGES_KEY],
    queryFn: async () => await DataRepo.chargesService.getCharges(),
  });

  useQuery<Array<CategoryType>, Error>({
    queryKey: [LIST_CATEGORY_KEY],
    queryFn: async () => await DataRepo.categoriesService.getCategories(),
  });

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          vibration('light');

          // if (!e.target) return;
          // const [name] = e.target.split('-');
          // setTabSelected(name as RoutesType);
        },
      }}
      screenOptions={{
        tabBarShowLabel: true,
        headerStatusBarHeight: 0,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#339AF0',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
          paddingTop: isAndroid ? 6 : 8,
          marginBottom: isAndroid ? 4 : isIPad ? 1 : 1,
          borderTopColor: 'transparent',
          // theme === 'dark' ? Colors.grayDark.gray5 : Colors.gray.gray7,
        },
      }}
    >
      <Tabs.Screen name="categories" options={categoriesTabConfig} />
      <Tabs.Screen name="budgets" options={budgetsTabConfig} />
      <Tabs.Screen name="charges" options={chargesTabConfig} />
      <Tabs.Screen name="user" options={userTabConfig} />
    </Tabs>
  );
}
