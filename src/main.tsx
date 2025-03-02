import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ViewerApp from './viewer/ViewerApp';
import AdminApp from './admin/AdminApp';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/viewer" replace />} />
          <Route path="/viewer/*" element={<ViewerApp />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
);
