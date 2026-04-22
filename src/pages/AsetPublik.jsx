import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Package, FileText, ExternalLink, Calendar, MapPin, Tag, DollarSign, School, CheckCircle } from 'lucide-react'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rosak:      { label: 'Rosak',      color: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  baik_pulih: { label: 'Baik Pulih', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  lupus:      { label: 'Lupus',      color: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
}

export default function AsetPublik() {
  const { id } = useParams()
  const [aset, setAset] = useState(null)
  const [dokumen, setDokumen] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { fetchAset() }, [id])

  async function fetchAset() {
    setLoading(true)
    const [asetRes, dokRes] = await Promise.all([
      supabase.from('aset').select('*').eq('id', id).single(),
      supabase.from('dokumen_aset').select('*').eq('aset_id', id).order('tarikh_upload', { ascending: false }),
    ])
    if (asetRes.error || !asetRes.data) setNotFound(true)
    else { setAset(asetRes.data); setDokumen(dokRes.data || []) }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Memuatkan maklumat aset...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center gap-3 text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
        <Package size={32} className="text-slate-300" />
      </div>
      <h1 className="text-lg font-bold text-slate-600">Aset Tidak Dijumpai</h1>
      <p className="text-sm text-slate-400">QR kod ini tidak sah atau aset telah dipadam.</p>
    </div>
  )

  const status = STATUS_CONFIG[aset.status] || { label: aset.status, color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#003399] via-[#0055cc] to-[#0077ff] text-white px-5 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img
            src="https://i.postimg.cc/pdhvk3Q2/images.jpg"
            alt="Logo SK Darau"
            className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0"
          />
          <div>
            <p className="text-xs text-blue-200 font-medium">Sekolah Kebangsaan Darau</p>
            <p className="text-sm font-bold">Rekod Aset Sekolah</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {aset.gambar_url ? (
            <img src={aset.gambar_url} alt={aset.nama} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-40 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Package size={48} className="text-slate-300" />
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{aset.nama}</h1>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{aset.no_siri}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {aset.kategori    && <InfoItem icon={<Tag size={13} />}         label="Kategori"       value={aset.kategori} />}
              {aset.lokasi      && <InfoItem icon={<MapPin size={13} />}      label="Lokasi"         value={aset.lokasi} />}
              {aset.jenama      && <InfoItem icon={<Package size={13} />}     label="Jenama / Model" value={[aset.jenama, aset.model].filter(Boolean).join(' ')} />}
              {aset.tarikh_terima && <InfoItem icon={<Calendar size={13} />}  label="Tarikh Terima"  value={new Date(aset.tarikh_terima).toLocaleDateString('ms-MY')} />}
              {aset.harga       && <InfoItem icon={<DollarSign size={13} />}  label="Harga Perolehan" value={`RM ${Number(aset.harga).toFixed(2)}`} />}
            </div>
          </div>
        </div>

        {/* Dokumen */}
        {dokumen.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <FileText size={15} className="text-blue-500" />
              Dokumen Berkaitan
            </h2>
            <div className="space-y-2">
              {dokumen.map(dok => (
                <a
                  key={dok.id}
                  href={dok.fail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{dok.nama_fail}</p>
                    <p className="text-xs text-slate-400 capitalize">{dok.jenis.replace('_', ' ')}</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-300 group-hover:text-blue-500 transition shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* QR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">QR Kod Aset</p>
          <div className="flex justify-center p-3 bg-slate-50 rounded-xl mx-auto">
            <QRCodeSVG value={window.location.href} size={130} level="M" />
          </div>
          <p className="text-xs text-slate-400 mt-3 break-all">{window.location.href}</p>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-400">Sekolah Kebangsaan Darau</p>
          <p className="text-xs text-slate-400">Guru Aset: Khairul Azwani bin Haji Ahinin</p>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-300">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  )
}
