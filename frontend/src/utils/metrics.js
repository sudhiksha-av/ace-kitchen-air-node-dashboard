export const METRICS = {
  temperature: { key: 'temperature', label: 'Temperature', unit: 'C', color: '#1b6a6f' },
  humidity: { key: 'humidity', label: 'Humidity', unit: '%', color: '#5d6fa3' },
  pm25: { key: 'pm25', label: 'PM2.5', unit: 'ug/m3', color: '#c97718' },
  pm10: { key: 'pm10', label: 'PM10', unit: 'ug/m3', color: '#8b5a2b' },
  aqi: { key: 'aqi', label: 'AQI', unit: '', color: '#7257a6' }
};

export const DEFAULT_METRICS = ['temperature', 'humidity', 'pm25', 'pm10', 'aqi'];

export function latestValue(row, key) {
  const value = row?.[key];
  return value === null || value === undefined ? '--' : value;
}
