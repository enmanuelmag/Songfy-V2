// import EmptySVG from '@assets/categories/empty-categories.svg';

import * as Burnt from 'burnt';
import { Controller, useForm } from 'react-hook-form';
import { Circle, Separator, Text, View, XStack, YStack } from 'tamagui';

import React from 'react';

import { TouchableOpacity } from 'react-native';

import DataRepo from '@api/datasource';
import queryClient from '@api/datasource/query';
import CategoryCard from '@components/category/category';
import ActionIcon from '@components/shared/action-icon';
import BottomSheetModal from '@components/shared/bottom-sheet';
import ButtonCustom from '@components/shared/button';
import CurrencyInputCustom from '@components/shared/currency-input';
import EmptyState from '@components/shared/empty-state';
import FlatGradientList from '@components/shared/flat-gradient-list';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import LoaderText from '@components/shared/loader-text';
import PopOver from '@components/shared/pop-over';
import TabBatLiquid from '@components/shared/tab-bar-liquid-glass';
import { Colors } from '@constants/budget';
import {
  CATEGORIES_ENTITY,
  CREATE_CATEGORY_KEY,
  DELETE_CATEGORY_KEY,
  GET_BUDGET_KEY,
  LIST_CATEGORY_KEY,
  UPDATE_CATEGORY_KEY,
} from '@constants/reactAPI';
import { Routes } from '@constants/routes';
import { CategoryCreateSchema } from '@customTypes/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@store/index';
import { BadgePlus } from '@tamagui/lucide-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isEmpty } from '@utils/form';
import { vibration } from '@utils/haptics';
import { isLoadingMutation, isLoadingQuery } from '@utils/network';
import { navigate } from '@utils/router';
import { capitalize } from '@utils/string';

import type { CategoryCreateType, CategoryType } from '@customTypes/budget';
import type { ModalProps } from '@customTypes/page';

const Categories = () => {
  const [localRefresh, setLocalRefresh] = React.useState(false);

  const [categoryFormPopover, setCategoryFormPopover] = React.useState<
    ModalProps<CategoryType | null>
  >({ open: false });

  const [categoryDeletePopover, setCategoryDeletePopover] =
    React.useState<CategoryType | null>(null);

  const categoriesQuery = useQuery<Array<CategoryType>, Error>({
    queryKey: [LIST_CATEGORY_KEY],
    queryFn: async () => await DataRepo.categoriesService.getCategories(),
  });

  const categoryCreateMutation = useMutation<
    CategoryType,
    Error,
    CategoryCreateType
  >({
    networkMode: 'always',
    mutationKey: [CREATE_CATEGORY_KEY],
    mutationFn: async (data) => {
      const response = await DataRepo.categoriesService.createCategory(data);

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [LIST_CATEGORY_KEY].includes(query.queryKey[0] as string),
      });

      return response;
    },
    onSettled: (_, error) => {
      if (error) {
        Burnt.toast({
          preset: 'error',
          title: 'Error creating category',
        });
      } else {
        Burnt.toast({
          preset: 'done',
          title: 'Category created',
        });
      }
    },
  });

  const isLoading =
    isLoadingQuery(categoriesQuery) ||
    isLoadingMutation(categoryCreateMutation);

  if (isLoading) {
    return (
      <YStack bg="$bgApp" height="100%" justify="center">
        <LoaderText text="Loading categories" />
      </YStack>
    );
  }

  return (
    <YStack bg="$bgApp" gap="$2" justify="flex-start" pt="$2" px="$3">
      {categoriesQuery.data && categoriesQuery.data.length === 0 && (
        <View height="100%" items="center" justify="center" width="100%">
          <EmptyState text="No categories found">
            <XStack justify="center" minW={200} mt="$4">
              <ButtonCustom
                text="Create a category"
                onPress={() => {
                  navigate({
                    to: Routes.CATEGORY_FORM,
                    params: { id: 'new' },
                  });
                }}
              />
            </XStack>
          </EmptyState>
        </View>
      )}

      {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
        <BottomSheetModal
          content={
            <React.Fragment>
              {categoryFormPopover.open && (
                <CategoryForm
                  categories={categoriesQuery.data}
                  data={categoryFormPopover.data}
                  open={Boolean(categoryFormPopover)}
                  setOpenPopover={(v) => {
                    if (!v) setCategoryFormPopover({ open: false });
                  }}
                />
              )}
              {categoryDeletePopover && (
                <CategoryDelete
                  data={categoryDeletePopover}
                  setOpenPopover={(v) => {
                    if (!v) setCategoryDeletePopover(null);
                  }}
                />
              )}
            </React.Fragment>
          }
          open={Boolean(categoryFormPopover.open || categoryDeletePopover)}
          onOpenChange={(v) => {
            if (!v) {
              categoryFormPopover.open &&
                setCategoryFormPopover({ open: false });
              categoryDeletePopover && setCategoryDeletePopover(null);
            }
          }}
        >
          <FlatGradientList
            isRefetching={categoriesQuery.isRefetching || localRefresh}
            items={categoriesQuery.data}
            refetch={() => {
              setLocalRefresh(true);

              queryClient
                .invalidateQueries({
                  type: 'all',
                  refetchType: 'all',
                  predicate: (query) =>
                    [CATEGORIES_ENTITY, CATEGORIES_ENTITY].includes(
                      query.queryKey[0] as string
                    ),
                })
                .finally(() => {
                  categoriesQuery.refetch();
                  setLocalRefresh(false);
                });
            }}
            renderItem={({ item, index }) => (
              <View
                key={`${item.id}-${index}`}
                mb={index === categoriesQuery.data.length - 1 ? '$12' : '$2'}
              >
                <CategoryCard
                  data={item}
                  loading={isLoadingMutation(categoryCreateMutation)}
                  onDelete={() => {
                    vibration('rigid');
                    setCategoryDeletePopover(item);
                  }}
                  onEdit={() => {
                    navigate({
                      to: Routes.CATEGORY_FORM,
                      params: { id: item.id },
                    });
                  }}
                />
              </View>
            )}
          />
        </BottomSheetModal>
      )}

      <TabBatLiquid />

      {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
        <FloatingButtons tabBottom={90}>
          <ActionIcon
            color="green"
            icon={<BadgePlus color="white" size={22} />}
            onPress={() => {
              navigate({
                to: Routes.CATEGORY_FORM,
                params: { id: 'new' },
              });
            }}
          />
        </FloatingButtons>
      )}
    </YStack>
  );
};

function getRandomColor(): string {
  const colors = Object.keys(Colors);

  const randomIdx = Math.floor(Math.random() * colors.length);

  return colors[randomIdx] as keyof typeof Colors;
}

function isDuplicateName(
  name: string,
  categories: Array<CategoryType>
): boolean {
  if (categories.length === 0) return false;

  return categories.some((category) => category.name === name);
}

type CategorySelectProps = {
  color: string;
  open?: boolean;
  setOpen: (value: boolean) => void;
  onChange: (value: string) => void;
};

function ColorSelect(props: CategorySelectProps) {
  const { open, color, onChange, setOpen } = props;

  return (
    <PopOver
      content={
        <GradientList fromPopOver>
          {Object.keys(Colors).map((colorKey) => (
            <XStack
              gap="$2"
              key={colorKey}
              mb="$4"
              onPress={() => {
                onChange(colorKey);
              }}
            >
              <Circle
                bg={
                  Colors[colorKey as keyof typeof Colors][500] as `#${string}`
                }
                size={24}
              />
              <Text color="$gray11" fontSize="$textMd">
                {capitalize(colorKey)}
              </Text>
            </XStack>
          ))}
        </GradientList>
      }
      open={open}
      snapPointsMode="percent"
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setOpen(true);
        }}
      >
        <XStack bg="$gray6" justify="center" py={8} rounded="$5">
          <Circle
            bg={Colors[color as keyof typeof Colors][500] as `#${string}`}
            size={24}
          />
        </XStack>
      </TouchableOpacity>
    </PopOver>
  );
}

type CategoryFormProps = {
  open: boolean;
  data?: CategoryType | null;
  categories: Array<CategoryType>;
  setOpenPopover: (value: boolean) => void;
};

function CategoryForm(props: CategoryFormProps) {
  const { categories, open, data, setOpenPopover } = props;

  const { currency } = useAppStore();

  const [openSelector, setOpenSelector] = React.useState(false);

  const formCategoryUpdate = useForm<CategoryCreateType>({
    defaultValues: data || {
      name: '',
      userId: '',
      color: getRandomColor(),
    },
    resolver: zodResolver(CategoryCreateSchema),
  });

  const categoryUpdateMutation = useMutation<
    boolean,
    Error,
    Partial<CategoryType>
  >({
    networkMode: 'always',
    mutationKey: [UPDATE_CATEGORY_KEY],
    mutationFn: async (dataUpdate) => {
      await DataRepo.categoriesService.updateCategory(data!.id, dataUpdate);

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [LIST_CATEGORY_KEY, GET_BUDGET_KEY].includes(
            query.queryKey[0] as string
          ),
      });

      return true;
    },
    onSettled: (_, error) => onSettledFunction(true, error),
  });

  React.useEffect(() => {
    if (!open) {
      formCategoryUpdate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const colorWatch = formCategoryUpdate.watch('color');

  const nameWatch = formCategoryUpdate.watch('name');

  return (
    <YStack>
      <Text color="$gray12" fontSize="$textLg" fontWeight="700">
        {data ? 'Update category' : 'Create category'}
      </Text>

      <Separator my="$4" />

      <GradientList fromPopOver>
        <YStack gap="$2">
          <XStack items="flex-end" justify="flex-end">
            <View flexBasis="80%" pr="$1.5">
              <Controller
                control={formCategoryUpdate.control}
                name="name"
                render={({ field }) => (
                  <InputText
                    error={formCategoryUpdate.formState.errors.name?.message}
                    label="Category name"
                    placeholder="Type a name"
                    {...field}
                    onChange={(e) => {
                      formCategoryUpdate.clearErrors();
                      formCategoryUpdate.setValue('name', String(e), {
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
                  formCategoryUpdate.setValue('color', colorKey, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setOpenSelector(false);
                }}
              />
            </View>
          </XStack>

          <Controller
            control={formCategoryUpdate.control}
            name="maxAmount"
            render={({ field }) => (
              <CurrencyInputCustom
                description="This is the maximum amount for the category"
                error={formCategoryUpdate.formState.errors.maxAmount?.message}
                label="Amount"
                placeholder="Type the amount"
                symbol={currency.symbol}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <ButtonCustom
            disabled={btnDisabled()}
            loading={
              categoryUpdateMutation.isPending && !categoryUpdateMutation.isIdle
            }
            text={data ? 'Update' : 'Create'}
            onPress={() => {
              if (!formCategoryUpdate.formState.isDirty) return;
              else if (
                nameWatch !== data?.name &&
                isDuplicateName(nameWatch, categories)
              ) {
                formCategoryUpdate.setError('name', {
                  type: 'value',
                  message: 'Category name already exists',
                });
                return;
              }

              formCategoryUpdate.handleSubmit((v) => {
                categoryUpdateMutation.mutate(v);
              })();
            }}
          />
        </YStack>
      </GradientList>
    </YStack>
  );

  function btnDisabled(): boolean {
    return (
      !isEmpty(formCategoryUpdate.formState.errors) ||
      !formCategoryUpdate.formState.isDirty
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
    setOpenPopover(false);
    formCategoryUpdate.reset();
  }
}

type CategoryDeleteProps = {
  data: CategoryType;
  setOpenPopover: (value: boolean) => void;
};

function CategoryDelete(props: CategoryDeleteProps) {
  const { data, setOpenPopover } = props;

  const categoryDeleteMutation = useMutation<boolean, Error, string>({
    networkMode: 'always',
    mutationKey: [DELETE_CATEGORY_KEY],
    mutationFn: async (id) => {
      const response = await DataRepo.categoriesService.deleteCategory(id);

      await queryClient.invalidateQueries({
        refetchType: 'all',
        predicate: (query) =>
          [LIST_CATEGORY_KEY, GET_BUDGET_KEY].includes(
            query.queryKey[0] as string
          ),
      });

      return response;
    },
    onSettled: (_, error) => {
      if (!error) {
        Burnt.toast({
          preset: 'done',
          title: 'Category deleted',
        });
        setOpenPopover(false);
      } else {
        Burnt.toast({
          title: error.message || 'Error',
          preset: 'error',
        });
      }
    },
  });

  return (
    <YStack>
      <Text color="$gray12" fontSize="$textXl" fontWeight="700">
        Delete category
      </Text>
      <Separator my="$4" />
      <GradientList fromPopOver>
        <YStack gap="$3">
          <Text color="$gray11" fontSize="$textMd">
            Are you sure you want to delete the category{' '}
            <Text color="$gray12" fontWeight="700">
              {data.name}
            </Text>
            ?
          </Text>
          <XStack gap="$2" justify="flex-end">
            <ButtonCustom
              color="red"
              fullWidth={false}
              loading={isLoadingMutation(categoryDeleteMutation)}
              text="Yes, delete"
              onPress={() => {
                vibration('rigid');
                categoryDeleteMutation.mutate(data.id);
              }}
            />
            <ButtonCustom
              color="gray"
              fullWidth={false}
              text="No, cancel"
              onPress={() => {
                vibration('light');
                setOpenPopover(false);
              }}
            />
          </XStack>
        </YStack>
      </GradientList>
    </YStack>
  );
}

export default Categories;
