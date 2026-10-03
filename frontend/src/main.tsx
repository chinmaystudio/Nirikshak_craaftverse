import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './modules/government/styles/tokens.css';
import './modules/government/styles/globals.css';
import './modules/government/styles/themes.css';
import './modules/government/styles/accessibility.css';
import './modules/user/styles/globals.css';
import './modules/contractor/index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
