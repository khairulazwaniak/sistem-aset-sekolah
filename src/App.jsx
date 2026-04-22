import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import SistemAset from './pages/SistemAset'
import AsetPublik from './pages/AsetPublik'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/aset" replace />} />
        <Route path="/aset" element={<SistemAset />} />
        <Route path="/aset/:id" element={<AsetPublik />} />
      </Routes>
    </BrowserRouter>
  )
}
