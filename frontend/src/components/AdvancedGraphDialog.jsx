import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import MultiMetricChart from '../charts/MultiMetricChart';
import { DEFAULT_METRICS, METRICS } from '../utils/metrics';
import { exportCsv, getData } from '../services/api';
import { fromInputDateTime, toInputDateTime } from '../utils/time';

function rowInputDateTime(row) {
  const raw = row?.timestamp_ist;
  if (!raw) return '';
  const text = String(raw);
  const isoLocal = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return isoLocal ? isoLocal[1] : toInputDateTime(raw);
}

function splitInputDateTime(value) {
  const [date = '', time = ''] = String(value || '').split('T');
  return { date, time };
}

function mergeInputDateTime(current, part, value) {
  const next = splitInputDateTime(current);
  next[part] = value;
  if (!next.date && !next.time) return '';
  return `${next.date || '1970-01-01'}T${next.time || '00:00'}`;
}

export default function AdvancedGraphDialog({ open, onClose, rows }) {
  const initializedForOpen = useRef(false);
  const [selected, setSelected] = useState(DEFAULT_METRICS);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rangeRows, setRangeRows] = useState([]);
  const [loadingRange, setLoadingRange] = useState(false);
  const [rangeError, setRangeError] = useState('');
  const availableRange = useMemo(() => {
    const stamps = rangeRows.map(rowInputDateTime).filter(Boolean).sort();
    return {
      start: stamps[0] || '',
      end: stamps.at(-1) || ''
    };
  }, [rangeRows]);

  useEffect(() => {
    if (!open) {
      initializedForOpen.current = false;
      return;
    }
    if (!initializedForOpen.current && rows.length) {
      const stamps = rows.map(rowInputDateTime).filter(Boolean).sort();
      setRangeRows(rows);
      setStart(stamps[0] || '');
      setEnd(stamps.at(-1) || '');
      initializedForOpen.current = true;
    }
  }, [open, rows]);

  const filteredRows = useMemo(() => {
    const rangeStart = start && end && start > end ? end : start;
    const rangeEnd = start && end && start > end ? start : end;
    return rangeRows.filter((row) => {
      const stamp = rowInputDateTime(row);
      if (rangeStart && stamp < rangeStart) return false;
      if (rangeEnd && stamp > rangeEnd) return false;
      return true;
    }).sort((first, second) => rowInputDateTime(first).localeCompare(rowInputDateTime(second)));
  }, [rangeRows, start, end]);
  const startParts = splitInputDateTime(start);
  const endParts = splitInputDateTime(end);

  function toggleMetric(key) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function reset() {
    setSelected(DEFAULT_METRICS);
    setStart(availableRange.start);
    setEnd(availableRange.end);
  }

  async function loadSelectedRange() {
    const rangeStart = start && end && start > end ? end : start;
    const rangeEnd = start && end && start > end ? start : end;
    setLoadingRange(true);
    setRangeError('');
    try {
      const loadedRows = await getData({
        start: fromInputDateTime(rangeStart),
        end: fromInputDateTime(rangeEnd)
      });
      setRangeRows(loadedRows);
      if (!loadedRows.length) {
        setRangeError('No ThingSpeak readings were returned for this range.');
      }
    } catch (error) {
      setRangeError(error.message || 'Could not load this date range.');
    } finally {
      setLoadingRange(false);
    }
  }

  function exportFilteredCsv() {
    const rangeStart = start && end && start > end ? end : start;
    const rangeEnd = start && end && start > end ? start : end;
    exportCsv({ start: fromInputDateTime(rangeStart), end: fromInputDateTime(rangeEnd) });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Advanced Graph</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Stack spacing={2}>
              <FormGroup>
                {DEFAULT_METRICS.map((key) => (
                  <FormControlLabel
                    key={key}
                    control={<Checkbox checked={selected.includes(key)} onChange={() => toggleMetric(key)} />}
                    label={METRICS[key].label}
                  />
                ))}
              </FormGroup>
              <Grid container spacing={1.5}>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="Start date"
                    type="date"
                    value={startParts.date}
                    onChange={(event) => setStart((current) => mergeInputDateTime(current, 'date', event.target.value))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Start time"
                    type="time"
                    value={startParts.time}
                    onChange={(event) => setStart((current) => mergeInputDateTime(current, 'time', event.target.value))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                  />
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label="End date"
                    type="date"
                    value={endParts.date}
                    onChange={(event) => setEnd((current) => mergeInputDateTime(current, 'date', event.target.value))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="End time"
                    type="time"
                    value={endParts.time}
                    onChange={(event) => setEnd((current) => mergeInputDateTime(current, 'time', event.target.value))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                startIcon={loadingRange ? <CircularProgress color="inherit" size={16} /> : <SearchIcon />}
                onClick={loadSelectedRange}
                disabled={loadingRange || !start || !end}
              >
                Load Range
              </Button>
              <Button startIcon={<RestartAltIcon />} onClick={reset}>Reset</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportFilteredCsv}
              >
                Export filtered CSV
              </Button>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredRows.length} of {rangeRows.length} loaded readings in the selected IST range.
              </Typography>
              {rangeError && (
                <Typography variant="caption" color="error">
                  {rangeError}
                </Typography>
              )}
              {availableRange.start && availableRange.end && (
                <Typography variant="caption" color="text.secondary">
                  Loaded data: {availableRange.start.replace('T', ' ')} to {availableRange.end.replace('T', ' ')} IST.
                </Typography>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={9}>
            <MultiMetricChart rows={filteredRows} metrics={selected} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
