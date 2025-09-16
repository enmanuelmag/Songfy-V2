import { Sheet, Text, View } from 'tamagui';

import React from 'react';

type BottomSheetProps = {
  content: string | React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (boolean: boolean) => void;
};

const BottomSheetModal = React.forwardRef<any, BottomSheetProps>(
  (props: BottomSheetProps, ref) => {
    const { open, content, children, onOpenChange } = props;

    return (
      <React.Fragment>
        {children}
        <Sheet
          dismissOnSnapToBottom
          modal
          moveOnKeyboardChange
          open={open}
          position={0}
          ref={ref}
          snapPointsMode="fit"
          zIndex={100000}
          onOpenChange={onOpenChange}
        >
          <Sheet.Overlay
            animation="lazy"
            bg="$shadowColor"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Sheet.Handle bg="white" />

          <Sheet.Frame px="$3.5" py="$4">
            <View pb="$4">
              {React.isValidElement(content) ? (
                content
              ) : (
                <Text color="$gray11" fontSize="$textMd">
                  {content}
                </Text>
              )}
            </View>
          </Sheet.Frame>
        </Sheet>
      </React.Fragment>
    );
  }
);

BottomSheetModal.displayName = 'ConfirmModal';

export default BottomSheetModal;
