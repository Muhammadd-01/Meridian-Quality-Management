import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import AppRouter from './router';

function ScrollToTopOnRoute() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll layout main container
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainEl.scrollTop = 0;
    }
    // Scroll window and root elements
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRoute />
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  );
}
