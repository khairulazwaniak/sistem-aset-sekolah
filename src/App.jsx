import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import SistemAset from './pages/SistemAset'
import DetailAset from './pages/DetailAset'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(26,5,53,0.9)',
            backdropFilter: 'blur(20px)',
            color: '#f1f5f9',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '16px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 600,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#f1f5f9' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/aset" replace />} />
        <Route path="/aset" element={<SistemAset />} />
        <Route path="/aset/:no_siri" element={<DetailAset />} />
      </Routes>
    </BrowserRouter>
  )
}
