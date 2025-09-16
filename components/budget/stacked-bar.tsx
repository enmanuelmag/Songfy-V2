import { StackedBarChart } from 'react-native-chart-kit';

import React from 'react';

import { Dimensions } from 'react-native';

import type { CategoryStackedBarPlotType } from '@customTypes/budget';

type StackedBarProps = {
  data: CategoryStackedBarPlotType;
};

// type TooltipPosType = {
//   x: number;
//   y: number;
//   value: React.ReactNode;
//   color?: string | null;
// };

const StackedBarChartCustom = (props: StackedBarProps) => {
  const { data } = props;

  // const [tooltip, setTooltip] = React.useState<TooltipPosType | null>(null);

  const { width } = Dimensions.get('screen');

  if (!data.barColors.length) return null;

  return (
    <StackedBarChart
      fromZero
      hideLegend
      chartConfig={{
        propsForHorizontalLabels: {
          disabled: true,
        },
        backgroundColor: '#FFF',
        backgroundGradientFrom: '#FFF',
        backgroundGradientTo: '#FFF',
        decimalPlaces: 0, // optional, defaults to 2dp
        color: () => `#404040`,
        labelColor: () => `#404040`,
        style: {
          borderRadius: 16,
          alignItems: 'center',
          alignContent: 'center',
        },
        propsForDots: {
          r: '7',
          stroke: '#FFF',
          strokeWidth: '1',
        },
      }}
      data={{
        labels: ['Categories'],
        legend: data.legend,
        barColors: data.barColors,
        data: data.data.map((d) => d),
      }}
      // decorator={() => {
      //   return tooltip ? (
      //     <View>
      //       <Svg>
      //         <Rect fill="white" height="30" width="40" x={tooltip.x - 15} y={tooltip.y + 10} />
      //         <TextSVG
      //           fill={tooltip.color ?? '#404040'}
      //           fontSize="16"
      //           fontWeight={600}
      //           textAnchor="middle"
      //           x={tooltip.x + 5}
      //           y={tooltip.y + 30}
      //         >
      //           {tooltip.value}
      //         </TextSVG>
      //       </Svg>
      //     </View>
      //   ) : null;
      // }}
      height={220}
      style={{
        borderRadius: 16,
      }}
      width={width - 16}
      // onDataPointClick={(point) => {
      //   const isSamePoint = tooltip ? tooltip.x === point.x && tooltip.y === point.y : false;
      //   setTooltip(
      //     isSamePoint
      //       ? null
      //       : {
      //           x: point.x,
      //           value: point.value,
      //           y: point.y,
      //           color: point.dataset.color?.(1),
      //         },
      //   );
      // }}
    />
  );
};

export default StackedBarChartCustom;
