import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, QrCode, FileText } from 'lucide-react'
import DokumenUpload from './DokumenUpload'

export default function QRModal({ aset, onClose }) {
  const printRef = useRef()
  const [tab, setTab] = useState('qr')
  const url = `${window.location.origin}/aset/${aset.id}`

  function handlePrint() {
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>QR - ${aset.nama}</title>
          <style>
            body { margin: 0; font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            .kad { border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; width: 240px; }
            .sekolah { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .nama { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
            .no { font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 12px; }
            .lokasi { font-size: 11px; color: #64748b; margin-top: 12px; }
            img.gambar { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="kad">
            <div class="sekolah">SK Darau</div>
            ${aset.gambar_url ? `<img class="gambar" src="${aset.gambar_url}" />` : ''}
            <div>${printRef.current?.innerHTML || ''}</div>
            <div class="nama">${aset.nama}</div>
            <div class="no">${aset.no_siri}</div>
            ${aset.lokasi ? `<div class="lokasi">Lokasi: ${aset.lokasi}</div>` : ''}
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div>
            <p className="text-base font-semibold text-slate-800">{aset.nama}</p>
            <p className="text-xs font-mono text-slate-400">{aset.no_siri}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Tab */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setTab('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${tab === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <QrCode size={15} />
            QR Kod
          </button>
          <button
            onClick={() => setTab('dokumen')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${tab === 'dokumen' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={15} />
            Surat Beranak
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'qr' && (
            <div className="text-center space-y-4">
              {aset.gambar_url && (
                <img src={aset.gambar_url} alt={aset.nama} className="w-20 h-20 rounded-xl object-cover mx-auto border border-slate-200" />
              )}

              <div ref={printRef} className="flex justify-center">
                <QRCodeSVG value={url} size={180} level="M" includeMargin />
              </div>

              <p className="text-xs text-slate-400 break-all">{url}</p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition"
                >
                  <Printer size={15} />
                  Print QR Kad
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  Tutup
                </button>
              </div>
            </div>
          )}

          {tab === 'dokumen' && (
            <DokumenUpload asetId={aset.id} />
          )}
        </div>
      </div>
    </div>
  )
}
