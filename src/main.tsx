import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Import supabase FIRST so it captures the token hash from the URL during initialization.
import './lib/supabase';
import App from './App.tsx';
import './index.css';

localStorage.removeItem('lkb_submissions');

// Intercept Supabase OAuth token fragments before HashRouter misinterprets them.
// After OAuth, the URL looks like: https://site.com/path#access_token=...&type=recovery
// HashRouter would treat this as a route, breaking navigation.
// The Supabase client (imported above) already captured the token from window.location.href
// during its initialization. Now we safely replace the hash for the router.
const rawHash = window.location.hash;
if (rawHash && rawHash.includes('access_token=')) {
  const returnPath = localStorage.getItem('auth_return_path') || '#/';
  localStorage.removeItem('auth_return_path');
  window.history.replaceState(null, '', window.location.pathname + window.location.search + returnPath);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
