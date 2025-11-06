import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Version info for debugging
console.log('🚀 MGT300 Risk Game - Version Info:');
console.log('📅 Build Date:', new Date().toLocaleString());
console.log('🔧 Last Commit:', 'BALANCE (2025-11-06 11:30:00) - Rebalance risk calculations for realistic outcomes');
console.log('👨‍💻 Environment:', import.meta.env.MODE);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
