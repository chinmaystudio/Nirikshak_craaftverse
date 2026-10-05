import React from 'react';
import ReactDOM from 'react-dom/client';
import { env } from './lib/config/env';
import { captureRecoveryProof } from './lib/auth/recoveryProof';
import './modules/government/styles/tokens.css';
import './modules/government/styles/globals.css';
import './modules/government/styles/themes.css';
import './modules/government/styles/accessibility.css';
import './modules/user/styles/globals.css';
import './modules/contractor/index.css';

const rootEl = document.getElementById('root');
captureRecoveryProof();
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);

  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    root.render(
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#f6f8fb',
          color: '#172033',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <section style={{ maxWidth: '560px', background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)' }}>
          <h1 style={{ marginTop: 0 }}>NIRIKSHAK is being configured</h1>
          <p>The application cannot start until its public Supabase configuration is available.</p>
          <p>Please try again shortly. The administrator needs to add the Supabase publishable key to the frontend deployment.</p>
        </section>
      </main>,
    );
  } else {
    void import('./app/App').then(({ default: App }) => {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    });
  }
}
