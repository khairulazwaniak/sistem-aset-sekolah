import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import {
  Package, FileText, ExternalLink, Calendar, MapPin,
  Tag, DollarSign, User, Shield, Truck, ClipboardList,
  CheckCircle, LogIn, LogOut, Clock, AlertCircle, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',      bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rosak:      { label: 'Rosak',      bg: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  baik_pulih: { label: 'Baik Pulih', bg: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  lupus:      { label: 'Lupus',      bg: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     bg: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
}

export default function DetailAset() {
  const { no_siri } = useParams()
  const [aset, setAset]             = useState(null)
  const [dokumen, setDokumen]       = useState([])
  const [pinjaman, setPinjaman]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [showBorang, setShowBorang] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm]             = useState({ nama_peminjam: '', jawatan: '' })

  useEffect(() => { fetchData() }, [no_siri])

  async function fetchData() {
    setLoading(true)
    const decoded = decodeURIComponent(no_siri)
    const { data: a, error } = await supabase.from('aset').select('*').eq('no_siri', decoded).single()
    if (error || !a) { setNotFound(true); setLoading(false); return }
    setAset(a)

    const [dokRes, pinRes] = await Promise.all([
      supabase.from('dokumen_aset').select('*').eq('aset_id', a.id).order('tarikh_upload', { ascending: false }),
      supabase.from('pinjaman').select('*').eq('aset_id', a.id).eq('status', 'aktif').single(),
    ])
    setDokumen(dokRes.data || [])
    setPinjaman(pinRes.data || null)
    setLoading(false)
  }

  async function handlePinjam(e) {
    e.preventDefault()
    if (!form.nama_peminjam.trim()) { toast.error('Sila masukkan nama'); return }
    setSubmitting(true)
    const { error } = await supabase.from('pinjaman').insert({
      aset_id:       aset.id,
      nama_peminjam: form.nama_peminjam.trim(),
      jawatan:       form.jawatan.trim() || null,
    })
    if (error) { toast.error('Gagal rekod peminjaman'); setSubmitting(false); return }
    toast.success('Peminjaman direkodkan')
    setForm({ nama_peminjam: '', jawatan: '' })
    setShowBorang(false)
    fetchData()
    setSubmitting(false)
  }

  async function handlePulang() {
    if (!pinjaman) return
    if (!confirm(`Sahkan pulangan dari ${pinjaman.nama_peminjam}?`)) return
    const { error } = await supabase.from('pinjaman').update({
      status: 'dipulangkan',
      tarikh_pulang: new Date().toISOString(),
    }).eq('id', pinjaman.id)
    if (error) { toast.error('Gagal rekod pulangan'); return }
    toast.success('Aset ditandakan dipulangkan')
    fetchData()
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

  const status   = STATUS_CONFIG[aset.status] || { label: aset.status, bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
  const sedangDipinjam = !!pinjaman
  const tarikhPinjam = pinjaman ? new Date(pinjaman.tarikh_pinjam).toLocaleString('ms-MY') : null

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-linear-to-r from-[#003399] via-[#0055cc] to-[#0077ff] text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src="https://i.postimg.cc/pdhvk3Q2/images.jpg" alt="SK Darau"
            className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0"/>
          <div>
            <p className="text-xs text-blue-200 font-medium">Sekolah Kebangsaan Darau</p>
            <p className="text-sm font-bold">Rekod Aset Sekolah</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-10">

        {/* Aset card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {aset.gambar_url
            ? <img src={aset.gambar_url} alt={aset.nama} className="w-full h-52 object-cover"/>
            : <div className="w-full h-32 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Package size={40} className="text-slate-300"/>
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

        {/* ── STATUS PINJAMAN ── */}
        {sedangDipinjam ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <User size={20} className="text-white"/>
              </div>
              <div className="flex-1">
                <p className="text-xs text-amber-600 font-medium">Sedang Dipinjam Oleh</p>
                <p className="text-base font-bold text-amber-900">{pinjaman.nama_peminjam}</p>
                {pinjaman.jawatan && <p className="text-xs text-amber-600">{pinjaman.jawatan}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Clock size={12}/>
              <span>Sejak: {tarikhPinjam}</span>
            </div>
            <button onClick={handlePulang}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-amber-300 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-50 transition">
              <LogOut size={16}/>
              Saya Pulangkan Aset Ini
            </button>
          </div>
        ) : (
          /* Borang pinjam */
          !showBorang ? (
            <button onClick={() => setShowBorang(true)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition shadow-sm shadow-blue-200">
              <LogIn size={20}/>
              Pinjam Aset Ini
            </button>
          ) : (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <LogIn size={18} className="text-blue-500"/>
                <p className="text-base font-bold text-slate-800">Borang Pinjaman</p>
              </div>

              <form onSubmit={handlePinjam} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh *</label>
                  <input
                    type="text"
                    value={form.nama_peminjam}
                    onChange={e => setForm(f => ({ ...f, nama_peminjam: e.target.value }))}
                    placeholder="Nama anda..."
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jawatan (pilihan)</label>
                  <input
                    type="text"
                    value={form.jawatan}
                    onChange={e => setForm(f => ({ ...f, jawatan: e.target.value }))}
                    placeholder="Guru, Penolong Kanan..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowBorang(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                    Batal
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                    Sahkan Pinjam
                  </button>
                </div>
              </form>

              <p className="text-xs text-slate-400 text-center">
                Maklumat ini direkodkan dalam sistem aset sekolah.
              </p>
            </div>
          )
        )}

        {/* Info aset */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Maklumat Aset</p>
          {aset.lokasi             && <InfoRow icon={<MapPin size={14}/>}         label="Lokasi"           value={aset.lokasi}/>}
          {aset.kategori           && <InfoRow icon={<Tag size={14}/>}            label="Kategori"         value={aset.kategori}/>}
          {aset.no_siri_pembuat    && <InfoRow icon={<ClipboardList size={14}/>}  label="No. Siri Pembuat" value={aset.no_siri_pembuat}/>}
          {aset.tarikh_terima      && <InfoRow icon={<Calendar size={14}/>}       label="Tarikh Diterima"  value={new Date(aset.tarikh_terima).toLocaleDateString('ms-MY')}/>}
          {aset.harga              && <InfoRow icon={<DollarSign size={14}/>}     label="Harga Perolehan"  value={`RM ${Number(aset.harga).toFixed(2)}`}/>}
        </div>

        {(aset.pembekal || aset.cara_perolehan || aset.tempoh_jaminan) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Perolehan & Jaminan</p>
            {aset.cara_perolehan     && <InfoRow icon={<Truck size={14}/>}   label="Cara Perolehan" value={aset.cara_perolehan}/>}
            {aset.pembekal           && <InfoRow icon={<Truck size={14}/>}   label="Pembekal"       value={aset.pembekal}/>}
            {aset.tempoh_jaminan     && <InfoRow icon={<Shield size={14}/>}  label="Tempoh Jaminan" value={aset.tempoh_jaminan}/>}
            {aset.tarikh_waranti_tamat && <InfoRow icon={<Shield size={14}/>} label="Tamat Waranti" value={new Date(aset.tarikh_waranti_tamat).toLocaleDateString('ms-MY')}/>}
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
            <QRCodeSVG value={window.location.href} size={120} level="M"/>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-2">SK Darau · Guru Aset: Khairul Azwani bin Haji Ahinin</p>
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
