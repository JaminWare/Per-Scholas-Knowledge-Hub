import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/supabase';
import App from './App.tsx';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { supabase } from './lib/supabase';
import './index.css';

localStorage.removeItem('lkb_submissions');

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason instanceof Error
    ? event.reason.message
    : String(event.reason ?? 'Unknown unhandled rejection');

  supabase.from('admin_audit_logs').insert({
    admin_email: 'system@frontend',
    action_taken: 'unhandled_rejection',
    target_id: window.location.pathname,
    target_title: msg.slice(0, 2000),
  }).then(({ error }) => {
    if (error) console.error('[UnhandledRejection] Telemetry failed:', error.message);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);
