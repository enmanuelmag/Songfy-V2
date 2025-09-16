import * as Burnt from 'burnt';
import { Controller, useForm } from 'react-hook-form';
import { Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { Stack, useLocalSearchParams } from 'expo-router';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import ActionIcon from '@components/shared/action-icon';
import ColorSelect from '@components/shared/color-select';
import CurrencyInputCustom from '@components/shared/currency-input';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import {
  GET_BUDGET_KEY,
  GET_CATEGORY_KEY,
  GET_SCHEDULE_KEY,
  LIST_CATEGORY_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { CategoryCreateSchema } from '@customTypes/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from '@tamagui/lucide-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingMutation } from '@utils/network';
import { navigate } from '@utils/router';

import type { CategoryCreateType, CategoryType } from '@customTypes/budget';

const defaultValues: CategoryCreateType = {
  color: 'red',
  maxAmount: null,
  name: '',
  userId: '',
};

const Categories = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const mode = id !== 'new' ? 'edit' : 'create';

  const categoriesQuery = useQuery<Array<CategoryType>, Error>({
    queryKey: [LIST_CATEGORY_KEY],
    queryFn: async () => await DataRepo.categoriesService.getCategories(),
  });

  const [openSelector, setOpenSelector] = React.useState(false);

  const categoryEditQuery = useQuery<CategoryType, Error>({
    enabled: mode === 'edit',
    queryKey: [GET_CATEGORY_KEY, id],
    queryFn: async () => {
      const category = await DataRepo.categoriesService.getCategoryById(id);

      return category;
    },
  });

  const categoryUpdateForm = useForm<CategoryCreateType>({
    defaultValues,
    resolver: zodResolver(CategoryCreateSchema),
  });

  const categoryUpdateMutation = useMutation<
    boolean,
    Error,
    CategoryCreateType
  >({
    networkMode: 'always',
    mutationFn: async (dataUpdate) => {
      if (mode === 'create') {
        await DataRepo.categoriesService.createCategory({
          ...dataUpdate,
        });
      } else if (categoriesQuery.data) {
        await DataRepo.categoriesService.updateCategory(
          categoryEditQuery.data!.id,
          dataUpdate
        );
      }

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [
            LIST_CATEGORY_KEY,
            GET_BUDGET_KEY,
            GET_SCHEDULE_KEY,
            GET_CATEGORY_KEY,
          ].includes(query.queryKey[0] as string),
      });

      return true;
    },
    onSettled: (_, error) => onSettledFunction(true, error),
  });

  React.useEffect(() => {
    if (categoryEditQuery.data) {
      categoryUpdateForm.reset(categoryEditQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryEditQuery.dataUpdatedAt]);

  const colorWatch = categoryUpdateForm.watch('color');

  const nameWatch = categoryUpdateForm.watch('name');

  const loading = isLoadingMutation(categoryUpdateMutation);

  return (
    <DismissKeyboardHOC>
      <GradientList>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text color="$primary" fontSize="$5">
                {mode === 'create' ? 'Create category' : 'Edit category'}
              </Text>
            ),
          }}
        />
        <YStack
          height="100%"
          justify="space-between"
          p="$3"
          rowGap="$3"
          width="100%"
        >
          <YStack gap="$2">
            <XStack items="flex-end" justify="flex-end">
              <View flexBasis="80%" pr="$1.5">
                <Controller
                  control={categoryUpdateForm.control}
                  name="name"
                  render={({ field }) => (
                    <InputText
                      error={categoryUpdateForm.formState.errors.name?.message}
                      label="Category name"
                      placeholder="Type a name"
                      {...field}
                      onChange={(e) => {
                        categoryUpdateForm.clearErrors();
                        categoryUpdateForm.setValue('name', String(e), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  )}
                />
              </View>
              <View flexBasis="20%" pl="$1.5">
                <ColorSelect
                  color={colorWatch}
                  open={openSelector}
                  setOpen={setOpenSelector}
                  onChange={(colorKey) => {
                    categoryUpdateForm.setValue('color', colorKey, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setOpenSelector(false);
                  }}
                />
              </View>
            </XStack>

            <Controller
              control={categoryUpdateForm.control}
              name="maxAmount"
              render={({ field }) => (
                <CurrencyInputCustom
                  description="This is the maximum amount for the category"
                  error={categoryUpdateForm.formState.errors.maxAmount?.message}
                  label="Amount"
                  placeholder="Type the amount"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </YStack>
        </YStack>
      </GradientList>
      <FloatingButtons>
        <ActionIcon
          color="green"
          disabled={btnDisabled()}
          icon={<Save color="white" size={22} />}
          loading={loading}
          onPress={() => {
            vibration('light');
            if (!categoryUpdateForm.formState.isDirty) return;
            else if (
              nameWatch !== categoryEditQuery.data?.name &&
              isDuplicateName(nameWatch, categoriesQuery.data || [])
            ) {
              categoryUpdateForm.setError('name', {
                type: 'value',
                message: 'Category name already exists',
              });
              return;
            }

            categoryUpdateForm.handleSubmit((v) => {
              categoryUpdateMutation.mutate(v);
            })();
          }}
        />
      </FloatingButtons>
    </DismissKeyboardHOC>
  );

  function btnDisabled(): boolean {
    return (
      !isEmpty(categoryUpdateForm.formState.errors) ||
      !categoryUpdateForm.formState.isDirty
    );
  }

  function onSettledFunction(changed?: boolean | null, error?: Error | null) {
    if (error) {
      Burnt.toast({
        preset: 'error',
        title: error.message || 'Error updating category',
      });
    }
    if (changed) {
      Burnt.toast({
        preset: 'done',
        title: 'Category updated',
      });
    }
    // setOpenPopover(false);
    navigate({
      to: Routes.CATEGORIES,
    });
    categoryUpdateForm.reset(defaultValues);
  }

  // function getRandomColor(): string {
  //   const colors = Object.keys(Colors);

  //   const randomIdx = Math.floor(Math.random() * colors.length);

  //   return colors[randomIdx] as keyof typeof Colors;
  // }

  function isDuplicateName(
    name: string,
    categories: Array<CategoryType>
  ): boolean {
    if (categories.length === 0) return false;

    return categories.some((category) => category.name === name);
  }
};

export default Categories;
