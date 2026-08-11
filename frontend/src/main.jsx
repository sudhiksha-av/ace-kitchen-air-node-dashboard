import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import DashboardHome from './pages/DashboardHome.jsx';
import './styles/global.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1b6a6f' },
    secondary: { main: '#7257a6' },
    background: { default: '#f5f7f8', paper: '#ffffff' },
    warning: { main: '#c97718' },
    error: { main: '#bf3030' },
    success: { main: '#2f7d46' }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 700 }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardHome />
    </ThemeProvider>
  </React.StrictMode>
);
