import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f1629',
            color: '#fff',
            border: '1px solid #1e2d4a',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#00d4aa', secondary: '#0f1629' },
          },
          error: {
            iconTheme: { primary: '#ff4757', secondary: '#0f1629' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
