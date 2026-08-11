import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import DownloadIcon from '@mui/icons-material/Download';
import OpacityIcon from '@mui/icons-material/Opacity';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import AdvancedGraphDialog from '../components/AdvancedGraphDialog';
import ComparisonPanel from '../components/ComparisonPanel';
import SensorCard from '../components/SensorCard';
import StatusBar from '../components/StatusBar';
import MetricChart from '../charts/MetricChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { exportCsv } from '../services/api';
import { latestValue, METRICS } from '../utils/metrics';

export default function DashboardHome() {
  const { loading, error, data, refresh } = useDashboardData();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const rows = data?.rows || [];
  const latest = data?.latest || {};

  const recentRows = useMemo(() => rows.slice(-96), [rows]);

  if (loading) {
    return (
      <Box className="center-screen">
        <CircularProgress />
        <Typography>Loading air quality dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack className="dashboard-header" direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
            <Box className="brand-title-row">
              <Box component="img" className="brand-logo brand-logo-left" src="/assets/ace-logo.png" alt="ACE Engineering College logo" />
              <Typography variant="h4" className="dashboard-title">ACE KITCHEN AIR NODE DASHBOARD</Typography>
              <Box component="img" className="brand-logo brand-logo-right" src="/assets/iiit-hyderabad-logo.jpg" alt="IIIT Hyderabad logo" />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button startIcon={<RefreshIcon />} onClick={refresh}>Refresh</Button>
              <Button startIcon={<DownloadIcon />} onClick={() => exportCsv()}>Export displayed CSV</Button>
              <Button variant="contained" startIcon={<QueryStatsIcon />} onClick={() => setAdvancedOpen(true)}>
                Advanced Graph
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          <StatusBar status={data?.node_status} lastUpdated={data?.last_updated_ist} alerts={data?.alerts} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <SensorCard title="Temperature" value={latestValue(latest, 'temperature')} unit="C" accent={METRICS.temperature.color} icon={<DeviceThermostatIcon color="primary" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <SensorCard title="Humidity" value={latestValue(latest, 'humidity')} unit="%" accent={METRICS.humidity.color} icon={<OpacityIcon color="primary" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <SensorCard title="PM2.5" value={latestValue(latest, 'pm25')} unit="ug/m3" accent={METRICS.pm25.color} icon={<ScienceIcon color="warning" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <SensorCard title="PM10" value={latestValue(latest, 'pm10')} unit="ug/m3" accent={METRICS.pm10.color} icon={<AirIcon color="warning" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <SensorCard
                title="AQI"
                value={latestValue(latest, 'aqi')}
                unit=""
                accent={latest?.aqi_color || METRICS.aqi.color}
                icon={<Box className="aqi-dot" sx={{ backgroundColor: latest?.aqi_color || METRICS.aqi.color }} />}
                helper={latest?.aqi_category}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {Object.keys(METRICS).map((key) => (
              <Grid item xs={12} lg={key === 'aqi' ? 12 : 6} key={key}>
                <Box className="chart-panel">
                  <Typography variant="h6">{METRICS[key].label}</Typography>
                  <MetricChart rows={recentRows} metricKey={key} />
                </Box>
              </Grid>
            ))}
          </Grid>

          <ComparisonPanel />
        </Stack>
      </Container>
      <AdvancedGraphDialog open={advancedOpen} onClose={() => setAdvancedOpen(false)} rows={rows} />
    </Box>
  );
}
