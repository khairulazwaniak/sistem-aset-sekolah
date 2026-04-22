import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, Search, Filter, Package, AlertTriangle,
  CheckCircle, Archive, Eye, Pencil, Trash2,
  School, UserCheck, ChevronDown, LayoutDashboard,
  XCircle, Wrench
} from 'lucide-react'
import toast from 'react-hot-toast'
import AsetForm from '../components/AsetForm'
import QRModal from '../components/QRModal'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',      color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  rosak:      { label: 'Rosak',      color: 'bg-red-100 text-red-700 ring-1 ring-red-200',             dot: 'bg-red-500' },
  baik_pulih: { label: 'Baik Pulih', color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-500' },
  lupus:      { label: 'Lupus',      color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',       dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     color: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',    dot: 'bg-orange-500' },
}

const KATEGORI_LIST = ['ICT', 'Perabot', 'Sukan', 'Buku', 'Elektrik', 'Lain-lain']

export default function SistemAset() {
  const [asetList, setAsetList] = useState([])
  const [loading, setLoading] = useState(true)
  const [carian, setCarian] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editAset, setEditAset] = useState(null)
  const [qrAset, setQrAset] = useState(null)

  useEffect(() => { fetchAset() }, [])

  async function fetchAset() {
    setLoading(true)
    const { data, error } = await supabase
      .from('aset')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Gagal muatkan aset')
    else setAsetList(data || [])
    setLoading(false)
  }

  function handleFormSuccess(newAset) {
    setShowForm(false)
    setEditAset(null)
    fetchAset()
    if (newAset) setQrAset(newAset)
  }

  async function handleDelete(id) {
    if (!confirm('Padam aset ini?')) return
    const { error } = await supabase.from('aset').delete().eq('id', id)
    if (error) toast.error('Gagal padam')
    else { toast.success('Aset dipadam'); fetchAset() }
  }

  const filtered = asetList.filter(a => {
    const q = carian.toLowerCase()
    const matchC = !carian || a.nama?.toLowerCase().includes(q) || a.no_siri?.toLowerCase().includes(q) || a.lokasi?.toLowerCase().includes(q)
    const matchK = !filterKategori || a.kategori === filterKategori
    const matchS = !filterStatus || a.status === filterStatus
    return matchC && matchK && matchS
  })

  const stats = {
    jumlah:     asetList.length,
    aktif:      asetList.filter(a => a.status === 'aktif').length,
    rosak:      asetList.filter(a => a.status === 'rosak').length,
    baik_pulih: asetList.filter(a => a.status === 'baik_pulih').length,
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ── Top Banner ── */}
      <div className="bg-linear-to-r from-[#003399] via-[#0055cc] to-[#0077ff] text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-5">
          <img
            src="https://i.postimg.cc/pdhvk3Q2/images.jpg"
            alt="Logo SK Darau"
            className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shrink-0"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Kementerian Pendidikan Malaysia</p>
            <h1 className="text-2xl font-bold leading-tight">Sekolah Kebangsaan Darau</h1>
            <p className="text-sm text-blue-100 mt-0.5">Sistem Pengurusan Aset Sekolah</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
            <UserCheck size={18} className="text-blue-200" />
            <div>
              <p className="text-xs text-blue-200">Guru Aset</p>
              <p className="text-sm font-semibold">Khairul Azwani bin Haji Ahinin</p>
            </div>
          </div>
        </div>

        {/* Sub nav */}
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white border-b-2 border-white">
              <LayoutDashboard size={15} />
              Dashboard Aset
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Jumlah Aset"
            value={stats.jumlah}
            icon={<Package size={22} />}
            gradient="from-blue-600 to-blue-500"
            light="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Aset Aktif"
            value={stats.aktif}
            icon={<CheckCircle size={22} />}
            gradient="from-emerald-600 to-emerald-500"
            light="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Rosak"
            value={stats.rosak}
            icon={<XCircle size={22} />}
            gradient="from-red-600 to-red-500"
            light="bg-red-50 text-red-600"
          />
          <StatCard
            label="Baik Pulih"
            value={stats.baik_pulih}
            icon={<Wrench size={22} />}
            gradient="from-amber-600 to-amber-500"
            light="bg-amber-50 text-amber-600"
          />
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">

          {/* Table Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Senarai Aset</h2>
              <p className="text-xs text-slate-400">{filtered.length} rekod dijumpai</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[220px]">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama, no. siri, lokasi..."
                  value={carian}
                  onChange={e => setCarian(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
              {/* Filter Kategori */}
              <div className="relative">
                <select
                  value={filterKategori}
                  onChange={e => setFilterKategori(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
              {/* Filter Status */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
              {/* Tambah */}
              <button
                onClick={() => { setEditAset(null); setShowForm(true) }}
                className="flex items-center gap-2 bg-[#003399] hover:bg-[#002277] text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-200"
              >
                <Plus size={16} />
                Tambah Aset
              </button>
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Memuatkan data...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {carian || filterKategori || filterStatus ? 'Tiada rekod dijumpai' : 'Belum ada aset didaftarkan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">No. Aset</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aset</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lokasi</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(aset => (
                    <tr key={aset.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{aset.no_siri}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {aset.gambar_url ? (
                            <img src={aset.gambar_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200">
                              <Package size={17} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{aset.nama}</p>
                            {(aset.jenama || aset.model) && (
                              <p className="text-xs text-slate-400">{[aset.jenama, aset.model].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {aset.kategori ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{aset.kategori}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-sm">{aset.lokasi || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[aset.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[aset.status]?.dot}`} />
                          {STATUS_CONFIG[aset.status]?.label || aset.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setQrAset(aset)}
                            title="Lihat QR"
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => { setEditAset(aset); setShowForm(true) }}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-500 hover:text-amber-600 transition"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(aset.id)}
                            title="Padam"
                            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">SK Darau · Sistem Pengurusan Aset</p>
            <p className="text-xs text-slate-400">Guru Aset: Khairul Azwani bin Haji Ahinin</p>
          </div>
        </div>
      </div>

      {showForm && (
        <AsetForm
          aset={editAset}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditAset(null) }}
        />
      )}

      {qrAset && (
        <QRModal aset={qrAset} onClose={() => setQrAset(null)} />
      )}
    </div>
  )
}

function StatCard({ label, value, icon, gradient, light }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
