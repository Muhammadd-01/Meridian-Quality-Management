import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { purgeDemoData } from './lib/demoData';
import './styles/index.css';

purgeDemoData();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
