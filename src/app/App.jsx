import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import AppRouter from './router';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  );
}
