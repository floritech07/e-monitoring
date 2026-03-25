import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Router from './router';

const container = document.getElementById('root');
if (!container) throw new Error('Root mount point #root not found');

createRoot(container).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
