import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';
import { getComparison, exportCsv } from '../services/api';
import { DEFAULT_METRICS, METRICS } from '../utils/metrics';
import { endOfToday, endOfYesterday, fromInputDateTime, startOfToday, startOfYesterday } from '../utils/time';

export default function ComparisonPanel() {
  const [mode, setMode] = useState('today-yesterday');
  const [ranges, setRanges] = useState({
    firstStart: '',
    firstEnd: '',
    secondStart: '',
    secondEnd: ''
  });
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    if (mode === 'today-yesterday') {
      return {
        first_start: startOfYesterday(),
        first_end: endOfYesterday(),
        second_start: startOfToday(),
        second_end: endOfToday()
      };
    }
    return {
      first_start: fromInputDateTime(ranges.firstStart),
      first_end: fromInputDateTime(ranges.firstEnd),
      second_start: fromInputDateTime(ranges.secondStart),
      second_end: fromInputDateTime(ranges.secondEnd)
    };
  }, [mode, ranges]);

  async function runComparison() {
    if (Object.values(params).some((value) => !value)) return;
    setLoading(true);
    try {
      const data = await getComparison(params);
      setComparison(data.comparison);
    } finally {
      setLoading(false);
    }
  }

  function updateRange(key, value) {
    setRanges((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="h6">Comparison</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField select label="Compare" size="small" value={mode} onChange={(event) => setMode(event.target.value)}>
              <MenuItem value="today-yesterday">Today vs Yesterday</MenuItem>
              <MenuItem value="custom">Two custom dates or time ranges</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<CompareArrowsIcon />} onClick={runComparison} disabled={loading}>
              Compare
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={() => exportCsv(params)}>
              Export comparison CSV
            </Button>
          </Stack>
        </Stack>

        {mode === 'custom' && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              ['firstStart', 'First start'],
              ['firstEnd', 'First end'],
              ['secondStart', 'Second start'],
              ['secondEnd', 'Second end']
            ].map(([key, label]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  type="datetime-local"
                  value={ranges[key]}
                  onChange={(event) => updateRange(key, event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell align="right">First avg</TableCell>
              <TableCell align="right">Second avg</TableCell>
              <TableCell align="right">Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DEFAULT_METRICS.map((key) => {
              const first = comparison?.first?.[key]?.avg;
              const second = comparison?.second?.[key]?.avg;
              const diff = comparison?.difference?.[key]?.avg_percent;
              return (
                <TableRow key={key}>
                  <TableCell>{METRICS[key].label}</TableCell>
                  <TableCell align="right">{first ?? '--'}</TableCell>
                  <TableCell align="right">{second ?? '--'}</TableCell>
                  <TableCell align="right">{diff === null || diff === undefined ? '--' : `${diff}%`}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary">
          Current comparison window starts from {dayjs(params.first_start).format('DD MMM YYYY HH:mm')} IST.
        </Typography>
      </CardContent>
    </Card>
  );
}
