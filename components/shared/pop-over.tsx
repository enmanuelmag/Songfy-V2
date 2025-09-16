import { Adapt, Popover, Text, View } from 'tamagui';

import React from 'react';

type PopoverProps = {
  content: string | React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  sheet?: boolean;
  onOpenChange?: (boolean: boolean) => void;
  snapPointsMode?: 'fit' | 'percent';
  portalProps?: {
    host: string;
  };
};

const PopOver = React.forwardRef<any, PopoverProps>(
  (props: PopoverProps, ref) => {
    const {
      children,
      content,
      open,
      onOpenChange,
      portalProps,
      sheet = true,
      snapPointsMode = 'fit',
    } = props;
    return (
      <Popover
        allowFlip
        stayInFrame
        open={open}
        placement="top"
        ref={ref}
        size="$4"
        onOpenChange={(value) => onOpenChange?.(value)}
      >
        <Popover.Trigger asChild m={0} p={0}>
          {children}
        </Popover.Trigger>

        <Adapt platform="touch" when={sheet ? undefined : 'sm'}>
          <Popover.Sheet
            dismissOnSnapToBottom
            modal
            moveOnKeyboardChange
            portalProps={portalProps}
            snapPoints={snapPointsMode === 'fit' ? undefined : [50]}
            snapPointsMode={snapPointsMode}
            zIndex={100_100}
          >
            <Popover.Sheet.Overlay
              animation="quick"
              bg="$shadowColor"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Popover.Sheet.Handle bg="white" />
            <Popover.Sheet.Frame p="$4">
              <Adapt.Contents />
            </Popover.Sheet.Frame>
          </Popover.Sheet>
        </Adapt>
        <Popover.Content
          elevate
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          borderColor="$borderColor"
          borderWidth={1}
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          style={{
            zIndex: 10000000,
          }}
        >
          <Popover.Arrow borderColor="$borderColor" borderWidth={1} />
          <View
            pt="$3"
            style={{
              zIndex: 1000000,
            }}
          >
            {React.isValidElement(content) ? content : <Text>{content}</Text>}
          </View>
        </Popover.Content>
      </Popover>
    );
  }
);

export default PopOver;
