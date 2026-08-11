import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function SensorCard({ title, value, unit, icon, accent, helper }) {
  return (
    <Card className="sensor-card" sx={{ borderTop: `4px solid ${accent}` }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          {icon}
        </Stack>
        <Typography variant="h4" className="sensor-value">
          {value}<Typography component="span" variant="body1" color="text.secondary"> {unit}</Typography>
        </Typography>
        {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
      </CardContent>
    </Card>
  );
}
