import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AccessibilityProvider } from './lib/AccessibilityContext.jsx';
import './index.css';

function ColorBlindFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {/* Deuteranopia */}
        <filter id="deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.367 0.536 0.098 0 0
                    0.280 0.693 0.027 0 0
                    0.000 0.049 0.951 0 0
                    0     0     0     1 0"
          />
        </filter>
        {/* Protanopia */}
        <filter id="protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0.000 0 0
                    0.558 0.442 0.000 0 0
                    0.000 0.242 0.758 0 0
                    0     0     0     1 0"
          />
        </filter>
        {/* Tritanopia */}
        <filter id="tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.950 0.050 0.000 0 0
                    0.000 0.433 0.567 0 0
                    0.000 0.475 0.525 0 0
                    0     0     0     1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <ColorBlindFilters />
      <App />
    </AccessibilityProvider>
  </React.StrictMode>
);
