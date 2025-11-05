import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Version info for debugging
console.log('🚀 MGT300 Risk Game - Version Info:');
console.log('📅 Build Date:', new Date().toLocaleString());
console.log('🔧 Last Commit:', 'NEW (2025-11-05 07:15:00) - Extend to 10 rounds and round all values');
console.log('👨‍💻 Environment:', import.meta.env.MODE);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
