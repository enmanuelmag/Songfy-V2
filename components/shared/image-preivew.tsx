import * as Burnt from 'burnt';
import { View } from 'tamagui';

import React from 'react';

import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';

import DataRepo from '@api/datasource';
import { blurhash } from '@constants/image';
import { Share } from '@tamagui/lucide-icons';
import { getMimeType } from '@utils/charge';
import { Logger } from '@utils/log';



import ActionIcon from './action-icon';
import Loader from './loader';

type ImagePreviewProps = {
  url: string;
  description: string;
  paymentId: string;
};

const ImagePreview = (props: ImagePreviewProps) => {
  const { url, description, paymentId } = props;

  const [loading, setLoading] = React.useState(false);

  return (
    <View>
      <Image
        contentFit="contain"
        placeholder={{ blurhash }}
        source={{ uri: url }}
        style={{ borderRadius: 8, width: '100%', height: 300 }}
        transition={1000}
      />
      <View bg="white" p="$5" position="absolute" r={0} t={0}>
        <ActionIcon
          icon={
            loading ? (
              <Loader color="#339AF0" />
            ) : (
              <Share color="$gray8" size="$1" />
            )
          }
          size={40}
          variant="icon"
          onPress={handleShare}
        />
      </View>
    </View>
  );

  async function handleShare() {
    setLoading(true);
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      try {
        const mimeType = getMimeType(url);

        const uriShareable = await DataRepo.chargesService.getFileFromURL({
          fileName: `${description}.${mimeType.replace('image/', '')}`,
          paymentId,
          mimeType,
        });

        await Sharing.shareAsync(uriShareable.uri, {
          dialogTitle: 'Share this image',
          mimeType: uriShareable.mimeType,
        });
        setLoading(false);
      } catch (error) {
        Logger.error('Error sharing image:', error);
        setLoading(false);

        Burnt.toast({
          preset: 'error',
          title: 'Error sharing image',
        });
      }
    } else {
      setLoading(false);

      Burnt.toast({
        preset: 'error',
        title: 'Sharing is not available on this platform',
      });
    }
  }
};

export default ImagePreview;
