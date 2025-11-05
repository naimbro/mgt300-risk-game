import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Version info for debugging
console.log('🚀 MGT300 Risk Game - Version Info:');
console.log('📅 Build Date:', new Date().toLocaleString());
console.log('🔧 Last Commit:', '18479a3 (2025-11-05 06:50:00) - Replace data display with research links for active learning');
console.log('👨‍💻 Environment:', import.meta.env.MODE);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
