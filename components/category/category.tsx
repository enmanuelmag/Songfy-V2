import { Card, Separator, Text, View, XStack } from 'tamagui';

import React from 'react';

import { Colors } from '@constants/budget';
import { Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';
import { formatCurrency } from '@utils/string';



import ActionIcon from '../shared/action-icon';
import ConfirmModal from '../shared/confirm-modal';

import type { CategoryType } from '@customTypes/budget';

type CategoryProps = {
  data: CategoryType;
  onEdit: () => void;
  onDelete: () => void;
  loading?: boolean;
};

const CategoryCard = (props: CategoryProps) => {
  const {
    loading,
    data: { name, color, maxAmount },
    onEdit,
    onDelete,
  } = props;

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  const hexColor = Colors[color as keyof typeof Colors][500] as
    | `#${string}`
    | null;

  return (
    <View
      bg="$cardBg"
      borderColor="$borderColor"
      borderLeftWidth={1}
      rounded="$3"
    >
      <Card
        bordered
        bg="$cardBg"
        borderLeftColor={hexColor || (Colors.grey[500] as `#${string}`)}
        borderLeftWidth={5}
        borderRadius="$3"
        onPress={(e) => {
          e.preventDefault();
        }}
      >
        <Card.Header pl="$2.5" pr="$3" py="$2">
          <XStack content="center" items="center" justify="space-between">
            <View>
              <Text color="$gray12" fontSize="$textMd">
                {name}
              </Text>
            </View>
            <XStack gap="$3">
              <ActionIcon
                onlyIcon
                icon={<Edit3 color="$gray12" size={18} />}
                variant="icon"
                onPress={() => {
                  vibration();
                  onEdit();
                }}
              />
              <ConfirmModal
                closeText="No, cancel"
                confirmText="Yes, delete"
                content={
                  <Text color="$gray10" fontSize="$textMd">
                    Are you sure you want to delete{' '}
                    <Text color="$gray12" fontSize="$textMd" fontWeight="bold">
                      {name}
                    </Text>
                    ?
                  </Text>
                }
                loading={loading}
                open={deleteModalOpen}
                title="Delete budget"
                onConfirm={() => {
                  vibration('heavy');
                  onDelete();
                }}
                onOpenChange={setDeleteModalOpen}
              >
                <ActionIcon
                  onlyIcon
                  icon={<Trash color="$red10" size={18} />}
                  variant="icon"
                  onPress={() => {
                    vibration();
                    setDeleteModalOpen(true);
                  }}
                />
              </ConfirmModal>
            </XStack>
          </XStack>
        </Card.Header>

        <Separator mb="$1" />

        <Card.Footer px="$2.5" py="$2.5">
          <Text color="$gray11" fontSize="$4">
            {maxAmount ? formatCurrency(maxAmount) : 'No limit'}
          </Text>
        </Card.Footer>
      </Card>
    </View>
  );
};

export default CategoryCard;
