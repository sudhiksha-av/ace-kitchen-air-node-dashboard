import React from 'react';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { formatIst } from '../utils/time';

export default function StatusBar({ status, lastUpdated, alerts }) {
  const online = status === 'Online';
  return (
    <Box className="status-band">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            color={online ? 'success' : 'error'}
            icon={online ? <SensorsIcon /> : <WifiOffIcon />}
            label={`Node ${status || 'Unknown'}`}
          />
          <Typography variant="body2" color="text.secondary">Last updated: {formatIst(lastUpdated)} IST</Typography>
          <Typography variant="body2" color="text.secondary">Auto-refresh: 15 seconds</Typography>
        </Stack>
        <Stack spacing={1} className="alert-stack">
          {alerts?.slice(0, 6).map((alert, index) => (
            <Alert key={`${alert.type}-${index}`} severity={alert.severity === 'critical' ? 'error' : 'warning'}>{alert.message}</Alert>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
