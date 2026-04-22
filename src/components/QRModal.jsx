import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer } from 'lucide-react'

export default function QRModal({ aset, onClose }) {
  const printRef = useRef()
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
            .nama { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
            .no { font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 12px; }
            .lokasi { font-size: 11px; color: #64748b; margin-top: 12px; }
            img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="kad">
            ${aset.gambar_url ? `<img src="${aset.gambar_url}" />` : ''}
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
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">QR Kod Aset</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          {aset.gambar_url && (
            <img src={aset.gambar_url} alt={aset.nama} className="w-20 h-20 rounded-xl object-cover mx-auto border border-slate-200" />
          )}

          <div>
            <p className="font-semibold text-slate-800">{aset.nama}</p>
            <p className="text-xs font-mono text-slate-500">{aset.no_siri}</p>
            {aset.lokasi && <p className="text-xs text-slate-400 mt-1">Lokasi: {aset.lokasi}</p>}
          </div>

          <div ref={printRef} className="flex justify-center">
            <QRCodeSVG value={url} size={180} level="M" includeMargin />
          </div>

          <p className="text-xs text-slate-400 break-all">{url}</p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition"
            >
              <Printer size={15} />
              Print QR Kad
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
