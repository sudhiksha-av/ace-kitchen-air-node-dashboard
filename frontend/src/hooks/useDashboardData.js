import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

export function useDashboardData() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = useCallback(async (force = false) => {
    try {
      const data = await getDashboard(force);
      setState({ loading: false, error: null, data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  return { ...state, refresh: () => load(true) };
}
