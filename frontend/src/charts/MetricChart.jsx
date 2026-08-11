import React from 'react';
import ReactECharts from 'echarts-for-react';
import { METRICS } from '../utils/metrics';
import { formatIst } from '../utils/time';

export default function MetricChart({ rows, metricKey, height = 220 }) {
  const metric = METRICS[metricKey];
  const option = {
    color: [metric.color],
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => `${value ?? '--'} ${metric.unit}`.trim()
    },
    grid: { left: 46, right: 18, top: 22, bottom: 42 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: rows.map((row) => formatIst(row.timestamp_ist, 'HH:mm')),
      axisLabel: { hideOverlap: true }
    },
    yAxis: { type: 'value', name: metric.unit, nameGap: 24, scale: true },
    series: [
      {
        name: metric.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((row) => row[metricKey]),
        areaStyle: { opacity: 0.08 }
      }
    ]
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}
