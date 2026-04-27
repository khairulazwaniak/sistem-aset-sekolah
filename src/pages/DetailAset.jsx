import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import {
  Package, FileText, ExternalLink, Calendar, MapPin,
  Tag, DollarSign, User, Shield, Truck, ClipboardList,
  School, CheckCircle, Clock, AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',      bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rosak:      { label: 'Rosak',      bg: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  baik_pulih: { label: 'Baik Pulih', bg: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  lupus:      { label: 'Lupus',      bg: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     bg: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
}

export default function DetailAset() {
  const { no_siri } = useParams()
  const [aset, setAset]       = useState(null)
  const [dokumen, setDokumen] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { fetchAset() }, [no_siri])

  async function fetchAset() {
    setLoading(true)
    // Decode URL-encoded no_siri (e.g. ASET%2FICT%2F2024%2F001 → ASET/ICT/2024/001)
    const decoded = decodeURIComponent(no_siri)
    const [asetRes, dokRes] = await Promise.all([
      supabase.from('aset').select('*').eq('no_siri', decoded).single(),
      supabase.from('dokumen_aset').select('*').eq('aset_id',
        // get id after first query — handled below
        '00000000-0000-0000-0000-000000000000'
      ).limit(0),
    ])

    if (asetRes.error || !asetRes.data) {
      setNotFound(true); setLoading(false); return
    }

    const a = asetRes.data
    setAset(a)

    const { data: docs } = await supabase
      .from('dokumen_aset').select('*').eq('aset_id', a.id)
      .order('tarikh_upload', { ascending: false })
    setDokumen(docs || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-400 text-sm">Memuatkan...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Package size={48} className="text-slate-200"/>
      <h1 className="text-lg font-bold text-slate-600">Aset Tidak Dijumpai</h1>
      <p className="text-sm text-slate-400">No. siri <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{decodeURIComponent(no_siri)}</code> tidak wujud dalam sistem.</p>
    </div>
  )

  const status = STATUS_CONFIG[aset.status] || { label: aset.status, bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
  const qrUrl  = window.location.href

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-linear-to-r from-[#003399] via-[#0055cc] to-[#0077ff] text-white px-4 py-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src="https://i.postimg.cc/pdhvk3Q2/images.jpg" alt="SK Darau"
            className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0"/>
          <div>
            <p className="text-xs text-blue-200 font-medium">Sekolah Kebangsaan Darau</p>
            <p className="text-sm font-bold">Rekod Aset Sekolah</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-8">

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {aset.gambar_url
            ? <img src={aset.gambar_url} alt={aset.nama} className="w-full h-52 object-cover"/>
            : <div className="w-full h-36 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Package size={48} className="text-slate-300"/>
              </div>
          }
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-800 leading-tight">{aset.nama}</h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}/>
                {status.label}
              </span>
            </div>
            {(aset.jenama || aset.model) && (
              <p className="text-sm text-slate-500 mb-1">{[aset.jenama, aset.model].filter(Boolean).join(' · ')}</p>
            )}
            <p className="text-xs font-mono text-slate-400 bg-slate-50 inline-block px-2 py-0.5 rounded-lg">{aset.no_siri}</p>
          </div>
        </div>

        {/* Dalam Jagaan */}
        {aset.pegawai && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <User size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-medium">Dalam Jagaan</p>
              <p className="text-sm font-bold text-blue-800">{aset.pegawai}</p>
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Maklumat Aset</p>

          {aset.lokasi          && <InfoRow icon={<MapPin size={14}/>}        label="Lokasi"           value={aset.lokasi}/>}
          {aset.kategori        && <InfoRow icon={<Tag size={14}/>}           label="Kategori"         value={aset.kategori}/>}
          {aset.no_siri_pembuat && <InfoRow icon={<ClipboardList size={14}/>} label="No. Siri Pembuat" value={aset.no_siri_pembuat}/>}
          {aset.tarikh_terima   && <InfoRow icon={<Calendar size={14}/>}     label="Tarikh Diterima"  value={new Date(aset.tarikh_terima).toLocaleDateString('ms-MY')}/>}
          {aset.tarikh_penempatan && <InfoRow icon={<Calendar size={14}/>}   label="Tarikh Penempatan" value={new Date(aset.tarikh_penempatan).toLocaleDateString('ms-MY')}/>}
          {aset.harga           && <InfoRow icon={<DollarSign size={14}/>}   label="Harga Perolehan"  value={`RM ${Number(aset.harga).toFixed(2)}`}/>}
          {aset.nilai_semasa    && <InfoRow icon={<DollarSign size={14}/>}   label="Nilai Semasa"     value={`RM ${Number(aset.nilai_semasa).toFixed(2)}`}/>}
        </div>

        {/* Perolehan */}
        {(aset.pembekal || aset.cara_perolehan || aset.no_kontrak || aset.tempoh_jaminan) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Perolehan & Jaminan</p>
            {aset.cara_perolehan  && <InfoRow icon={<Truck size={14}/>}   label="Cara Perolehan"  value={aset.cara_perolehan}/>}
            {aset.pembekal        && <InfoRow icon={<Truck size={14}/>}   label="Pembekal"        value={aset.pembekal}/>}
            {aset.no_kontrak      && <InfoRow icon={<ClipboardList size={14}/>} label="No. Kontrak" value={aset.no_kontrak}/>}
            {aset.tempoh_jaminan  && <InfoRow icon={<Shield size={14}/>}  label="Tempoh Jaminan"  value={aset.tempoh_jaminan}/>}
            {aset.tarikh_waranti_tamat && <InfoRow icon={<Shield size={14}/>} label="Tamat Waranti" value={new Date(aset.tarikh_waranti_tamat).toLocaleDateString('ms-MY')}/>}
          </div>
        )}

        {/* Tanggungjawab */}
        {(aset.ketua_jabatan || aset.pegawai_bertanggungjawab) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggungjawab</p>
            {aset.pegawai_bertanggungjawab && <InfoRow icon={<User size={14}/>} label="Pegawai Aset" value={aset.pegawai_bertanggungjawab}/>}
            {aset.ketua_jabatan && <InfoRow icon={<User size={14}/>} label="Ketua Jabatan" value={aset.ketua_jabatan}/>}
          </div>
        )}

        {/* Spesifikasi */}
        {aset.spesifikasi && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Spesifikasi</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{aset.spesifikasi}</p>
          </div>
        )}

        {/* Dokumen */}
        {dokumen.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dokumen / Surat Beranak</p>
            <div className="space-y-2">
              {dokumen.map(dok => (
                <a key={dok.id} href={dok.fail_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-blue-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{dok.nama_fail}</p>
                    <p className="text-xs text-slate-400 capitalize">{dok.jenis?.replace('_',' ')}</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-300 group-hover:text-blue-500 shrink-0"/>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* QR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">QR Kod Aset</p>
          <div className="flex justify-center p-3 bg-slate-50 rounded-xl">
            <QRCodeSVG value={qrUrl} size={130} level="M"/>
          </div>
          <p className="text-xs text-slate-400 mt-2 break-all">{qrUrl}</p>
        </div>

        <p className="text-center text-xs text-slate-400">Sekolah Kebangsaan Darau · Sistem Aset</p>
        <p className="text-center text-xs text-slate-400">Guru Aset: Khairul Azwani bin Haji Ahinin</p>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-slate-300 shrink-0">{icon}</span>
      <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-700 flex-1 text-right">{value}</span>
    </div>
  )
}
