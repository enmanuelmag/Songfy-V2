import { Button } from 'tamagui';

import React from 'react';

import { TouchableOpacity } from 'react-native';

import { BlurView } from 'expo-blur';

import { UI } from '@constants/app';
import { useColor } from '@hooks/use-theme-color';
import { useAppStore } from '@store/index';



import Loader from './loader';

import type { StyleProp } from 'react-native';
import type colors from 'tailwindcss/colors';
import type { SizeTokens, ViewStyle } from 'tamagui';

type ButtonCustomProps = {
  text?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  color?: keyof typeof colors;
  variant?: 'default' | 'filled' | 'outline' | 'transparent' | 'icon';
  iconLeft?: any;
  iconRight?: any;
  loading?: boolean;
  isActionIcon?: boolean;
  onlyIcon?: boolean;
  style?: any;
  size?: number;
  alignSelf?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'baseline'
    | 'auto';
  onPress?: (e: any) => void;
};

const ButtonCustom = React.forwardRef<any, ButtonCustomProps>(
  (props: ButtonCustomProps, ref) => {
    const {
      alignSelf,
      disabled,
      text,
      fullWidth,
      variant = 'filled',
      isActionIcon,
      iconLeft,
      iconRight,
      loading,
      color: c,
      onlyIcon,
      onPress,
      size,
      style,
    } = props;

    const { theme } = useAppStore();

    const colorHex = useColor(c || 'blue', 500);

    const btnStyles = getColorsStyles();

    if (isActionIcon && !onlyIcon) {
      return (
        <TouchableOpacity
          ref={ref}
          onPress={disabled || loading ? undefined : onPress}
        >
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={10}
            style={{
              height: size || 55,
              width: size || 55,
              backgroundColor: `${colorHex}85`,
              borderColor: theme === 'dark' ? '#ffffff46' : '#00000010',
              borderWidth: 1,
              borderRadius: 55,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingRight: 0.5,
              paddingBottom: 0.5,
            }}
            tint={theme === 'dark' ? 'dark' : 'light'}
          >
            {loading ? (
              <Loader
                color={
                  variant === 'filled' || variant === 'default'
                    ? 'white'
                    : colorHex
                }
              />
            ) : (
              React.cloneElement(iconLeft, {
                color: 'white',
              })
            )}
          </BlurView>
        </TouchableOpacity>
        // <Circle
        //   ref={ref}
        //   size={size || 55}
        //   onPress={disabled || loading ? undefined : onPress}
        //   {...{ ...btnStyles.buttonStyle, ...style }}
        //   // style={{
        //   //   backdropFilter: 'blur(10px)',
        //   //   backgroundColor: `${colorHex}50`,
        //   // }}
        // >
        //   <BlurView
        //     experimentalBlurMethod="dimezisBlurView"
        //     intensity={8}
        //     style={{
        //       position: 'absolute',
        //       top: 0,
        //       left: 0,
        //       height: '100%',
        //       width: '100%',
        //       borderRadius: 55,
        //       overflow: 'hidden',
        //     }}
        //     tint={theme === 'dark' ? 'dark' : 'light'}
        //   >
        //     {loading ? (
        //       <Loader
        //         color={
        //           variant === 'filled' || variant === 'default'
        //             ? 'white'
        //             : colorHex
        //         }
        //       />
        //     ) : (
        //       React.cloneElement(iconLeft, {
        //         color: 'white',
        //       })
        //     )}
        //   </BlurView>
        // </Circle>
      );
    }

    if (onlyIcon) {
      return (
        <Button
          disabled={disabled}
          height="auto"
          icon={
            loading ? (
              <Loader
                color={
                  variant === 'filled' || variant === 'default'
                    ? 'white'
                    : colorHex
                }
              />
            ) : (
              iconLeft || iconRight
            )
          }
          m={0}
          p={0}
          ref={ref}
          size={UI.Size as SizeTokens}
          textProps={btnStyles.titleStyle}
          onPress={disabled ? undefined : onPress}
          {...{ ...btnStyles.buttonStyle, ...style }}
        />
      );
    }

    return (
      <Button
        borderColor={variant === 'outline' ? colorHex : undefined}
        disabled={disabled}
        grow={fullWidth !== undefined ? fullWidth : 1}
        icon={
          loading ? (
            <Loader
              color={
                variant === 'filled' || variant === 'default'
                  ? 'white'
                  : colorHex
              }
            />
          ) : (
            iconLeft &&
            React.cloneElement(iconLeft, {
              color:
                variant === 'filled' || variant === 'default'
                  ? 'white'
                  : colorHex,
            })
          )
        }
        iconAfter={iconRight}
        ref={ref}
        size={UI.Size as SizeTokens}
        textAlign={alignSelf}
        textProps={btnStyles.titleStyle}
        onPress={disabled ? undefined : onPress}
        {...{ ...btnStyles.buttonStyle, ...style }}
      >
        {loading && isActionIcon ? undefined : text}
      </Button>
    );

    function getColorsStyles() {
      const styles: StyleProp<ViewStyle> = {
        // borderRadius: 8,
        height: 40,
      };

      const titleStyles: Record<string, unknown> = {
        color: colorHex,
        textAlign: 'center',
        marginHorizontal: 4,
        fontSize: '$textMd',
        fontWeight: '500',
      };

      if (disabled) {
        styles.bg = theme === 'light' ? '#e5e7eb' : '#3f3f46';
        styles.borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

        return {
          buttonStyle: styles,
          titleStyles,
        };
      }

      if (variant === 'default' || variant === 'filled') {
        if (isActionIcon && !onlyIcon) {
          // const borderColor = theme === 'dark' ? '#ffffff46' : '#ffffff80';
          styles.bg = `${colorHex}65`;
          // styles.borderColor = borderColor; // 'transparent';
          // styles.borderWidth = 1;
          // add backdrop filter blur 1px
          // styles.backdropFilter = 'blur(10px)';
        } else {
          styles.bg = colorHex;
          styles.borderWidth = 0;
        }
        titleStyles.color = '#FFFFFF';
      } else if (variant === 'outline') {
        styles.borderColor = colorHex;
        styles.borderWidth = 1;
        styles.bg = 'transparent';
        titleStyles.color = colorHex;
      } else if (variant === 'transparent') {
        styles.bg = 'transparent';
        styles.borderColor = 'transparent';
        titleStyles.color = colorHex;
      } else {
        if (onlyIcon) {
          styles.bg = 'transparent';
          styles.borderColor = 'transparent';
          styles.p = '$1.5';
          styles.m = 0;
          styles.height = 'auto';
          titleStyles.color = colorHex;
        } else {
          styles.bg = colorHex;
          titleStyles.color = '#FFFFFF';
        }
      }

      return {
        buttonStyle: styles,
        titleStyle: titleStyles,
      };
    }
  }
);

export default ButtonCustom;
