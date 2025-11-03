<template>
  <v-chart class="chart" :option="progressOption" autoresize />
</template>

<script setup lang="ts">
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ComposeOption } from 'echarts/core';
import type { BarSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
} from 'echarts/components';
import VChart from 'vue-echarts';
// composables
import { useGoal } from '../../composables/useGoal';

const { getTimeProgress, getRemainingDays } = useGoal();
use([TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer]);

type EChartsOption = ComposeOption<
  TitleComponentOption | TooltipComponentOption | GridComponentOption | BarSeriesOption
>;

import { computed } from 'vue';
import { Goal } from '@dailyuse/domain-client';
import { useTheme } from 'vuetify';
import { format } from 'date-fns';
const theme = useTheme();

const props = defineProps<{
  goal: Goal | null;
}>();

const danger_threshold = 20;
const warning_threshold = 10;
const danger_color = '#ff4d4f';
const warning_color = '#faad14';
const safe_color = '#52c41a';

const surfaceColor = theme.current.value.colors.surface;
const fontColor = theme.current.value.colors.font; // 获取主题主色

const progressOption = computed<EChartsOption>(() => {
  const progress = props.goal?.weightedProgress ?? 0;
  const timeProgress = Math.round((getTimeProgress(props.goal!) ?? 0) * 100);

  let bgColor = safe_color;
  if (timeProgress - progress >= danger_threshold) {
    bgColor = danger_color;
  } else if (timeProgress - progress >= warning_threshold) {
    bgColor = warning_color;
  }

  return {
    backgroundColor: surfaceColor,
    title: {
      text: '目标完成进度 vs 时间进度',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 },
    },
    grid: { left: 100, right: 30, top: 50, bottom: 30 },
    tooltip: {
      backgroundColor: surfaceColor,
      borderColor: 'transparent',
      textStyle: {
        color: fontColor,
        fontSize: 14,
      },
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const { name, value } = params[0];
        if (name === '时间进度') {
          // 假设 goal 有 startTime, endTime, leftDays 属性
          const start = props.goal?.startTime ?? '';
          const end = props.goal?.endTime ?? '';
          const leftDays = getRemainingDays(props.goal!);
          return `
        <div>
          <strong>时间进度</strong><br/>
          ${format(new Date(start), 'yyyy-MM-dd')} - ${format(new Date(end), 'yyyy-MM-dd')}<br/>
          剩余：${leftDays}天
        </div>
      `;
        } else if (name === '目标完成进度') {
          const progress = props.goal?.weightedProgress ?? 0;
          const timeProgress = Math.round((getTimeProgress(props.goal!) ?? 0) * 100);
          const diff = progress - timeProgress;
          const status = diff > 0 ? '领先' : '落后';
          return `
        <div>
          <strong>目标完成进度</strong><br/>
          ${status}时间进度 ${Math.abs(diff)}%
        </div>
      `;
        }
        return `${name}: ${value}%`;
      },
    },
    xAxis: {
      max: 100,
      splitLine: { show: false },
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: ['目标完成进度', '时间进度'],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 14 },
    },
    series: [
      {
        type: 'bar',
        data: [progress, timeProgress],
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 14,
          color: fontColor,
        },
        itemStyle: {
          color: bgColor,
          borderRadius: [8, 8, 8, 8],
        },
        barWidth: 18,
      },
    ],
  };
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 220px;
  min-height: 180px;
  margin-bottom: 24px;

  border-radius: 15px;
  overflow: hidden;
}
</style>
