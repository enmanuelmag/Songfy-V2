import { AnimatePresence, Input, Label, Text, YStack } from 'tamagui';

import React from 'react';

import { Keyboard } from 'react-native';

import { UI } from '@constants/app';

import type {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  TextInput,
} from 'react-native';
import type { SizeTokens } from 'tamagui';

type InputTextProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  label?: string;
  autoFocus?: boolean;
  description?: string;
  name?: string;
  disabled?: boolean | null;
  value?: string | number | null;
  placeholder?: string;
  error?: string;
  isPassword?: boolean;
  readOnly?: boolean | null;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  textContentType?: TextContentType;
  autoComplete?: AutoCompleteType;
  multiline?: boolean;
  numberOfLines?: number;
  onBlur?: () => void;
  onChange?: (value: string | number) => void;
  onPress?: () => void;
};

const InputText = React.forwardRef<TextInput, InputTextProps>(
  (props: InputTextProps, ref) => {
    const {
      label,
      description,
      disabled,
      placeholder,
      error,
      value,
      isPassword,
      onBlur,
      onChange,
      onPress,
      autoFocus,
      autoCapitalize,
      textContentType,
      autoComplete,
      multiline,
      numberOfLines,
      returnKeyType = 'done',
      keyboardType = 'default',
    } = props;

    return (
      <YStack gap={0} onPress={() => null}>
        {label && (
          <Label
            fontSize="$3"
            fontWeight="600"
            lineHeight="$6"
            onPress={() => Keyboard.dismiss()}
          >
            {label}
          </Label>
        )}
        <Input
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          bg="$gray1"
          clearButtonMode="while-editing"
          disabled={Boolean(disabled)}
          importantForAutofill={autoComplete ? 'yes' : 'no'}
          keyboardType={keyboardType}
          maskType="luminance"
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholder={placeholder}
          readOnly={Boolean(props.readOnly)}
          ref={ref}
          returnKeyType={returnKeyType}
          secureTextEntry={Boolean(isPassword)}
          size={UI.Size as SizeTokens}
          style={
            multiline && {
              textAlignVertical: 'top',
            }
          }
          textContentType={textContentType}
          value={value ? String(value) : ''}
          onBlur={onBlur}
          onChangeText={(e) => {
            onChange?.(keyboardType === 'numeric' ? Number(e) : e);
          }}
          onPress={onPress}
        />
        {!error && description && (
          <Text fontSize="$textXs" fontWeight="400" mt="$2">
            {description}
          </Text>
        )}
        <AnimatePresence initial={false}>
          {error && (
            <Text
              animation="quick"
              color="red"
              enterStyle={{
                opacity: 0,
                scale: 0.7,
              }}
              exitStyle={{
                opacity: 1,
              }}
              fontSize="$textMd"
              fontWeight="300"
              mt="$1.5"
            >
              {error}
            </Text>
          )}
        </AnimatePresence>
      </YStack>
    );
  }
);

type AutoCompleteType =
  | 'additional-name'
  | 'address-line1'
  | 'address-line2'
  | 'birthdate-day'
  | 'birthdate-full'
  | 'birthdate-month'
  | 'birthdate-year'
  | 'cc-csc'
  | 'cc-exp'
  | 'cc-exp-day'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-number'
  | 'cc-name'
  | 'cc-given-name'
  | 'cc-middle-name'
  | 'cc-family-name'
  | 'cc-type'
  | 'country'
  | 'current-password'
  | 'email'
  | 'family-name'
  | 'gender'
  | 'given-name'
  | 'honorific-prefix'
  | 'honorific-suffix'
  | 'name'
  | 'name-family'
  | 'name-given'
  | 'name-middle'
  | 'name-middle-initial'
  | 'name-prefix'
  | 'name-suffix'
  | 'new-password'
  | 'nickname'
  | 'one-time-code'
  | 'organization'
  | 'organization-title'
  | 'password'
  | 'password-new'
  | 'postal-address'
  | 'postal-address-country'
  | 'postal-address-extended'
  | 'postal-address-extended-postal-code'
  | 'postal-address-locality'
  | 'postal-address-region'
  | 'postal-code'
  | 'street-address'
  | 'sms-otp'
  | 'tel'
  | 'tel-country-code'
  | 'tel-national'
  | 'tel-device'
  | 'url'
  | 'username'
  | 'username-new'
  | 'off'
  | undefined;

type TextContentType =
  | 'none'
  | 'URL'
  | 'addressCity'
  | 'addressCityAndState'
  | 'addressState'
  | 'countryName'
  | 'creditCardNumber'
  | 'creditCardExpiration'
  | 'creditCardExpirationMonth'
  | 'creditCardExpirationYear'
  | 'creditCardSecurityCode'
  | 'creditCardType'
  | 'creditCardName'
  | 'creditCardGivenName'
  | 'creditCardMiddleName'
  | 'creditCardFamilyName'
  | 'emailAddress'
  | 'familyName'
  | 'fullStreetAddress'
  | 'givenName'
  | 'jobTitle'
  | 'location'
  | 'middleName'
  | 'name'
  | 'namePrefix'
  | 'nameSuffix'
  | 'nickname'
  | 'organizationName'
  | 'postalCode'
  | 'streetAddressLine1'
  | 'streetAddressLine2'
  | 'sublocality'
  | 'telephoneNumber'
  | 'username'
  | 'password'
  | 'newPassword'
  | 'oneTimeCode'
  | 'birthdate'
  | 'birthdateDay'
  | 'birthdateMonth'
  | 'birthdateYear'
  | undefined;

export default InputText;
