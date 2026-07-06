import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/supabase';
import App from './App.tsx';
import './index.css';

localStorage.removeItem('lkb_submissions');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
