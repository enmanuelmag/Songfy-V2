import { LineChart } from 'react-native-chart-kit';
import { Rect, Svg, Text as TextSVG } from 'react-native-svg';
import { Text, View } from 'tamagui';

import React from 'react';

import { Dimensions } from 'react-native';

import { MaxMonthsLinePlot } from '@constants/budget';
import { useAppStore } from '@store/index';
import { formatCurrency, formatCurrencyLabel } from '@utils/string';
import { getBgColor } from '@utils/styles';


import type { BudgetLinePlotType } from '@customTypes/budget';

type LinePlotProps = {
  data: BudgetLinePlotType;
};

type TooltipPosType = {
  x: number;
  y: number;
  value: number;
  color?: string | null;
};

const LinePlotCustom = (props: LinePlotProps) => {
  const { theme } = useAppStore();

  const colorBg = getBgColor(theme);

  const { data } = props;

  const [tooltip, setTooltip] = React.useState<TooltipPosType | null>(null);

  const { width } = Dimensions.get('screen');

  const colorText = theme === 'dark' ? '#FFF' : '#404040';

  return (
    <View>
      <LineChart
        bezier
        fromZero
        chartConfig={{
          propsForHorizontalLabels: {
            disabled: true,
          },
          backgroundColor: colorBg,
          backgroundGradientFrom: colorBg,
          backgroundGradientTo: colorBg,
          decimalPlaces: 0, // optional, defaults to 2dp
          color: () => colorText,
          labelColor: () => colorText,
          style: {
            borderRadius: 16,
            alignItems: 'center',
            alignContent: 'center',
          },
          propsForDots: {
            r: '7',
            stroke: colorText,
            strokeWidth: '1',
          },
        }}
        data={{
          datasets: data.datasets.map((d) => ({
            data: d.data,
            strokeWidth: 2,
            color: () => d.color, // optional
          })),
          labels: data.labels,
        }}
        decorator={() => {
          if (!tooltip) return null;

          const amountText = formatCurrency(tooltip.value);
          const widthText = amountText.length * 8 + 30;
          return (
            <View>
              <Svg>
                <Rect
                  fill={colorBg}
                  height="35"
                  width={widthText}
                  x={tooltip.x - widthText / 2 + 5}
                  y={tooltip.y + 8}
                />
                <TextSVG
                  fill={tooltip.color ?? colorText}
                  fontSize="16"
                  fontWeight={600}
                  textAnchor="middle"
                  x={tooltip.x + 5}
                  y={tooltip.y + 30}
                >
                  {formatCurrency(tooltip.value)}
                </TextSVG>
              </Svg>
            </View>
          );
        }}
        formatYLabel={(value) => formatCurrencyLabel(Number(value))}
        height={220}
        style={{
          // paddingRight: 48,
          paddingRight: 48,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
        width={width - 32}
        withInnerLines={true}
        withOuterLines={false}
        withShadow={false}
        withVerticalLines={false}
        onDataPointClick={(point) => {
          const isSamePoint = tooltip
            ? tooltip.x === point.x && tooltip.y === point.y
            : false;
          setTooltip(
            isSamePoint
              ? null
              : {
                  x: point.x,
                  value: point.value,
                  y: point.y,
                  color: point.dataset.color?.(1),
                }
          );
        }}
      />
      <Text color="$gray10" fontSize="$textSm">
        <Text color="$blue9" fontSize="$textSm" fontWeight="600">
          Blue
        </Text>{' '}
        line is for balance,{' '}
        <Text color="$green9" fontSize="$textSm" fontWeight="600">
          Green
        </Text>{' '}
        one is for income and{' '}
        <Text color="$red9" fontSize="$textSm" fontWeight="600">
          Red
        </Text>{' '}
        one is for expenses.
      </Text>
      <Text color="$gray10" fontSize="$textSm" mt="$2">
        You can tap on the dots to see the amount. Only the first{' '}
        <Text color="$gray11" fontSize="$textSm" fontWeight="bold">
          {MaxMonthsLinePlot} months
        </Text>{' '}
        are shown.
      </Text>
    </View>
  );
};

export default LinePlotCustom;
