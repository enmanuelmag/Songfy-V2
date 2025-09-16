import { Card, Separator, Text, View, XStack } from 'tamagui';

import React from 'react';

import { Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';


import ActionIcon from '../shared/action-icon';
import ConfirmModal from '../shared/confirm-modal';

import type { DebtorType } from '@customTypes/charges';

type DebtProps = {
  data: DebtorType;
  onEdit: () => void;
  onDelete: () => void;
};

const Debtor = (props: DebtProps) => {
  const { data, onEdit, onDelete } = props;

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  return (
    <Card bordered bg="$cardBg" rounded="$4" size="$2" onPress={onEdit}>
      <Card.Header px="$3" py="$2">
        <XStack content="center" items="center" justify="space-between">
          <View>
            <Text color="$gray12" fontSize="$textMd">
              {data.name}
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
                  Are you sure you want to delete the debtor{' '}
                  <Text color="$gray12" fontSize="$textMd" fontWeight="bold">
                    {data.name}
                  </Text>
                  ?
                </Text>
              }
              open={deleteModalOpen}
              title="Delete debtor"
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
          {data.description}
        </Text>
      </Card.Footer>
    </Card>
  );
};

export default Debtor;
