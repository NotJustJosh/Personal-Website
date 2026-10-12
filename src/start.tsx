// First: points the label font + Draco decoder at this site, before anything loads.
import './lib/selfHosted'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// The app proper — loaded by main.tsx once it knows this device can run it.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
