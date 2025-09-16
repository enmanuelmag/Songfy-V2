import { Card, Separator, Text, View, XStack } from 'tamagui';

import React from 'react';

import { Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';


import ActionIcon from '../shared/action-icon';
import ConfirmModal from '../shared/confirm-modal';

import type { ChargeType } from '@customTypes/charges';

type ChargeProps = {
  data: ChargeType;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const Charge = (props: ChargeProps) => {
  const {
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
      size="$2"
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
                <Text color="$gray10">
                  Are you sure you want to delete{' '}
                  <Text color="$gray12" fontSize="$textMd" fontWeight="bold">
                    {name}
                  </Text>{' '}
                  cargue?
                </Text>
              }
              open={deleteModalOpen}
              title="Delete budget"
              onConfirm={onDelete}
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

export default Charge;
