import { Card, Text, View, XStack } from 'tamagui';

import React from 'react';


import ActionIcon from '@components/shared/action-icon';
import ConfirmModal from '@components/shared/confirm-modal';
import { Edit3, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';

type EmailCardProps = {
  email: string;
  loading?: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

const EmailCard = (props: EmailCardProps) => {
  const { email, loading, onDelete, onEdit } = props;

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  return (
    <Card
      bordered
      bg="$cardBg"
      borderRadius="$3"
      onPress={(e) => {
        e.preventDefault();
      }}
    >
      <Card.Header px="$3" py="$2">
        <XStack content="center" items="center" justify="space-between">
          <View flexBasis="80%">
            <Text color="$gray12" fontSize="$textMd">
              {email}
            </Text>
          </View>

          <XStack flexBasis="20%" gap="$3" justify="flex-end">
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
                    {email}
                  </Text>
                  ?
                </Text>
              }
              loading={loading}
              open={deleteModalOpen}
              title="Delete email"
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
    </Card>
  );
};

export default EmailCard;
