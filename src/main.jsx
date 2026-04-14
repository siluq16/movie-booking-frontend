import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181E',
              color: '#F0EDE4',
              border: '1px solid #2A2A34',
              fontFamily: "'DM Sans', sans-serif",
            },
            success: { iconTheme: { primary: '#52C97C', secondary: '#18181E' } },
            error:   { iconTheme: { primary: '#E05252', secondary: '#18181E' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
