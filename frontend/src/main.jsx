import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { seedDefaults } from './utils/defaults.js'

// Seed demo data on first launch (no-op if data already exists)
seedDefaults();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
