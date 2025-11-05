import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Version info for debugging
console.log('🚀 MGT300 Risk Game - Version Info:');
console.log('📅 Build Date:', new Date().toLocaleString());
console.log('🔧 Last Commit:', 'de3257f (2025-11-04 22:55:23) - Fix submissions array safety in submitInvestment');
console.log('👨‍💻 Environment:', import.meta.env.MODE);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
