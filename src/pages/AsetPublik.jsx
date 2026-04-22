import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Package, FileText, ExternalLink, Calendar, MapPin, Tag, DollarSign } from 'lucide-react'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',       color: 'bg-green-100 text-green-800' },
  rosak:      { label: 'Rosak',       color: 'bg-red-100 text-red-800' },
  baik_pulih: { label: 'Baik Pulih',  color: 'bg-yellow-100 text-yellow-800' },
  lupus:      { label: 'Lupus',       color: 'bg-gray-100 text-gray-600' },
  hilang:     { label: 'Hilang',      color: 'bg-orange-100 text-orange-800' },
}

export default function AsetPublik() {
  const { id } = useParams()
  const [aset, setAset] = useState(null)
  const [dokumen, setDokumen] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchAset()
  }, [id])

  async function fetchAset() {
    setLoading(true)
    const [asetRes, dokRes] = await Promise.all([
      supabase.from('aset').select('*').eq('id', id).single(),
      supabase.from('dokumen_aset').select('*').eq('aset_id', id).order('tarikh_upload', { ascending: false }),
    ])

    if (asetRes.error || !asetRes.data) {
      setNotFound(true)
    } else {
      setAset(asetRes.data)
      setDokumen(dokRes.data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Memuatkan maklumat aset...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-center p-6">
        <Package size={48} className="text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-600">Aset Tidak Dijumpai</h1>
        <p className="text-sm text-slate-400">QR kod ini tidak sah atau aset telah dipadam.</p>
      </div>
    )
  }

  const status = STATUS_CONFIG[aset.status] || { label: aset.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header kad */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {aset.gambar_url ? (
            <img src={aset.gambar_url} alt={aset.nama} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-52 bg-slate-100 flex items-center justify-center">
              <Package size={48} className="text-slate-300" />
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{aset.nama}</h1>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{aset.no_siri}</p>
              </div>
              <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {aset.kategori && (
                <InfoItem icon={<Tag size={14} />} label="Kategori" value={aset.kategori} />
              )}
              {aset.lokasi && (
                <InfoItem icon={<MapPin size={14} />} label="Lokasi" value={aset.lokasi} />
              )}
              {aset.jenama && (
                <InfoItem icon={<Package size={14} />} label="Jenama / Model" value={`${aset.jenama}${aset.model ? ` ${aset.model}` : ''}`} />
              )}
              {aset.tarikh_terima && (
                <InfoItem icon={<Calendar size={14} />} label="Tarikh Terima" value={new Date(aset.tarikh_terima).toLocaleDateString('ms-MY')} />
              )}
              {aset.harga && (
                <InfoItem icon={<DollarSign size={14} />} label="Harga" value={`RM ${Number(aset.harga).toFixed(2)}`} />
              )}
            </div>
          </div>
        </div>

        {/* Dokumen */}
        {dokumen.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Dokumen Berkaitan</h2>
            <div className="space-y-2">
              {dokumen.map(dok => (
                <a
                  key={dok.id}
                  href={dok.fail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition group"
                >
                  <FileText size={18} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{dok.nama_fail}</p>
                    <p className="text-xs text-slate-400 capitalize">{dok.jenis.replace('_', ' ')}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500 transition" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* QR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-xs text-slate-500 mb-3">QR Kod Aset Ini</p>
          <div className="flex justify-center">
            <QRCodeSVG value={window.location.href} size={120} level="M" includeMargin />
          </div>
          <p className="text-xs text-slate-400 mt-2 break-all">{window.location.href}</p>
        </div>

        <p className="text-center text-xs text-slate-400">Sistem Pengurusan Aset Sekolah</p>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
