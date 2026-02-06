import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DebugErrorBoundary } from './components/DebugErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebugErrorBoundary>
      <App />
    </DebugErrorBoundary>
  </StrictMode>,
)
