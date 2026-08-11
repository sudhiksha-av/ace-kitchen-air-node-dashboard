import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Typography } from '@mui/material';
import { METRICS } from '../utils/metrics';
import { formatIst } from '../utils/time';

export default function MultiMetricChart({ rows, metrics, comparisonRows }) {
  const chartRef = useRef(null);
  const activeMetrics = metrics.length ? metrics : ['aqi'];
  const categories = rows.map((row) => formatIst(row.timestamp_ist, 'DD MMM HH:mm'));
  const hasRows = rows.length > 0;
  const yAxis = activeMetrics.map((key, index) => ({
    type: 'value',
    name: index < 2 ? METRICS[key].label : '',
    scale: true,
    position: index === 1 ? 'right' : 'left',
    offset: index > 1 ? 0 : undefined,
    axisLabel: { show: index < 2 },
    axisLine: { show: index < 2 },
    axisTick: { show: index < 2 },
    splitLine: { show: index === 0 }
  }));

  const series = activeMetrics.flatMap((key) => {
    const metric = METRICS[key];
    const yAxisIndex = activeMetrics.indexOf(key);
    const base = {
      name: metric.label,
      type: 'line',
      yAxisIndex,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: rows.length <= 80,
      connectNulls: true,
      data: rows.map((row) => {
        const value = Number(row[key]);
        return Number.isFinite(value) ? value : null;
      }),
      emphasis: { focus: 'series' }
    };
    if (!comparisonRows?.length) return [base];
    return [
      base,
      {
        ...base,
        name: `${metric.label} comparison`,
        data: comparisonRows.map((row) => {
          const value = Number(row[key]);
          return Number.isFinite(value) ? value : null;
        }),
        lineStyle: { type: 'dashed' }
      }
    ];
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      chartRef.current?.getEchartsInstance()?.resize();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [rows, metrics]);

  const option = {
    color: activeMetrics.map((key) => METRICS[key].color),
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0 },
    grid: { left: 64, right: 58, top: 54, bottom: 76, containLabel: true },
    toolbox: {
      right: 8,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
        saveAsImage: {}
      }
    },
    dataZoom: [
      { type: 'inside', throttle: 50 },
      { type: 'slider', bottom: 16 }
    ],
    xAxis: { type: 'category', boundaryGap: false, data: categories, axisLabel: { hideOverlap: true } },
    yAxis,
    series
  };

  if (!hasRows) {
    return (
      <Box className="empty-chart">
        <Typography variant="body2" color="text.secondary">No readings available for the selected range.</Typography>
      </Box>
    );
  }

  return <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: 520 }} notMerge lazyUpdate />;
}
