import { Card, Separator, Text, View, XStack } from 'tamagui';

import React from 'react';

import { Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';


import ActionIcon from '../shared/action-icon';
import ConfirmModal from '../shared/confirm-modal';

import type { BudgetBaseType } from '@customTypes/budget';

type BudgetProps = {
  data: BudgetBaseType;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  loading?: boolean;
};

const Budget = (props: BudgetProps) => {
  const {
    loading,
    data: { name, description },
    onEdit,
    onDelete,
    onView,
  } = props;

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  return (
    <Card
      bordered
      bg="$cardBg"
      borderRadius="$3"
      onPress={(e) => {
        e.preventDefault();
        onView();
      }}
    >
      <Card.Header px="$3" py="$2">
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

      <Card.Footer px="$3" py="$2.5">
        <Text color="$gray11" fontSize="$4" numberOfLines={2}>
          {description}
        </Text>
      </Card.Footer>
    </Card>
  );
};

export default Budget;
