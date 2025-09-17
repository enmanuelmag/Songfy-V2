import { Text, View } from 'tamagui';

import React from 'react';

import LoaderText from '@components/shared/loader-text';

type PlaylistAnalyzePopProps = {
  text?: string | null;
};

const PlaylistAnalyzePop = (props: PlaylistAnalyzePopProps) => {
  return (
    <View flex={1} flexDirection="column">
      <LoaderText text="Syncing playlist" />
      {props.text && (
        <Text color="$gray9" mt="$2" text="center">
          {props.text}
        </Text>
      )}
    </View>
  );
};

export default PlaylistAnalyzePop;
