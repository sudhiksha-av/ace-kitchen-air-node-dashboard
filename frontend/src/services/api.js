import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

export async function getDashboard(force = false) {
  const { data } = await api.get('/api/dashboard', { params: { force } });
  return data;
}

export async function getData(params = {}) {
  const { data } = await api.get('/api/data', { params });
  return data.rows;
}

export async function getComparison(params) {
  const { data } = await api.get('/api/compare', { params });
  return data;
}

export function exportCsv(params = {}) {
  const url = new URL('/api/export.csv', window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  window.location.href = url.toString();
}

export async function getDashboard(force = false) {
  const { data } = await api.get('/api/dashboard', { params: { force } });
  return data;
}

export async function getData(params = {}) {
  const { data } = await api.get('/api/data', { params });
  return data.rows;
}

export async function getComparison(params) {
  const { data } = await api.get('/api/compare', { params });
  return data;
}

export function exportCsv(params = {}) {
  const url = new URL('/api/export.csv', api.defaults.baseURL);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  window.location.href = url.toString();
}
