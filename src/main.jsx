import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Import the Radix UI theme styles. These CSS variables enable theming across
// Radix components. Without this import, components will render unstyled.
import '@radix-ui/themes/styles.css';
import './index.css';

// Initialise the root element and render the application.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);