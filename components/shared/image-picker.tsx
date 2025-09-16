import * as Burnt from 'burnt';
import { View, YStack } from 'tamagui';

import React from 'react';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { blurhash } from '@constants/image';
import { FileImage, Trash } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';
import { getBase64String } from '@utils/image';
import { Logger } from '@utils/log';



import ActionIcon from './action-icon';
import ButtonCustom from './button';

import type colors from 'tailwindcss/colors';

type ImagePickerProps = {
  text: string;
  value?: string | null;
  loading?: boolean;
  color?: keyof typeof colors;
  onChange: (value?: string | null) => void;
  onRemove: () => void;
  onPickerOpen?: () => void;
};

const ImagePickerCustom = React.forwardRef<any, ImagePickerProps>(
  (props: ImagePickerProps, ref) => {
    const { value, loading, text, onChange, onRemove, onPickerOpen } = props;

    return (
      <YStack gap="$4">
        <ButtonCustom
          iconLeft={<FileImage color="$primary" size="$1.5" />}
          loading={loading}
          text={text}
          variant="outline"
          onPress={pickImage}
        />
        {value && (
          <View ref={ref}>
            <Image
              blurRadius={4}
              contentFit="cover"
              placeholder={{ blurhash }}
              source={{
                uri: value,
              }}
              style={{
                height: 200,
                width: '100%',
              }}
              transition={1000}
            />
            <View bg="white" p="$5" position="absolute" r={0} t={0}>
              <ActionIcon
                icon={<Trash color="red" size="$1" />}
                size={40}
                variant="icon"
                onPress={() => {
                  vibration('heavy');
                  onRemove();
                }}
              />
            </View>
          </View>
        )}
      </YStack>
    );

    async function pickImage() {
      if (loading) return;

      const allowed = await requestGalleryPermission();

      if (!allowed) return;

      onPickerOpen?.();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.3,
      });

      let data = null;

      if (!result.canceled) {
        const image = result.assets[0];
        if (!image.base64) {
          Burnt.toast({
            preset: 'error',
            title: 'Error getting image',
          });
        } else {
          data = getBase64String(image.base64, image.mimeType);
        }
      }
      onChange(data);
    }
  }
);

async function requestGalleryPermission() {
  try {
    await ImagePicker.requestMediaLibraryPermissionsAsync().then(
      ({ status }) => {
        if (status !== 'granted') {
          ImagePicker.requestMediaLibraryPermissionsAsync().then(
            ({ status: reqStatus }) => {
              if (reqStatus !== 'granted') {
                Burnt.toast({
                  preset: 'error',
                  title: 'Permission to access camera roll is required',
                });
                Logger.error('Permission to access camera roll is required!');
                throw new Error(
                  'Permission to access camera roll is required!'
                );
              }
            }
          );
        }
      }
    );
    return true;
  } catch (error) {
    Logger.error('Error requesting gallery permission:', error);
    return false;
  }
}

export default ImagePickerCustom;
