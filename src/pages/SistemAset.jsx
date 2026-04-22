import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Filter, Package, AlertTriangle, CheckCircle, Archive, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import AsetForm from '../components/AsetForm'
import QRModal from '../components/QRModal'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',       color: 'bg-green-100 text-green-800' },
  rosak:      { label: 'Rosak',       color: 'bg-red-100 text-red-800' },
  baik_pulih: { label: 'Baik Pulih',  color: 'bg-yellow-100 text-yellow-800' },
  lupus:      { label: 'Lupus',       color: 'bg-gray-100 text-gray-600' },
  hilang:     { label: 'Hilang',      color: 'bg-orange-100 text-orange-800' },
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

  useEffect(() => {
    fetchAset()
  }, [])

  async function fetchAset() {
    setLoading(true)
    const { data, error } = await supabase
      .from('aset')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal muatkan aset')
    } else {
      setAsetList(data || [])
    }
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
    if (error) {
      toast.error('Gagal padam')
    } else {
      toast.success('Aset dipadam')
      fetchAset()
    }
  }

  const filtered = asetList.filter(a => {
    const q = carian.toLowerCase()
    const matchCarian = !carian || a.nama?.toLowerCase().includes(q) || a.no_siri?.toLowerCase().includes(q) || a.lokasi?.toLowerCase().includes(q)
    const matchKategori = !filterKategori || a.kategori === filterKategori
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchCarian && matchKategori && matchStatus
  })

  const stats = {
    jumlah: asetList.length,
    aktif: asetList.filter(a => a.status === 'aktif').length,
    rosak: asetList.filter(a => a.status === 'rosak').length,
    lupus: asetList.filter(a => a.status === 'lupus').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Sistem Pengurusan Aset Sekolah</h1>
            <p className="text-sm text-slate-500">Daftar & urus semua aset sekolah</p>
          </div>
          <button
            onClick={() => { setEditAset(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Tambah Aset
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Package size={20} />} label="Jumlah Aset" value={stats.jumlah} color="blue" />
          <StatCard icon={<CheckCircle size={20} />} label="Aktif" value={stats.aktif} color="green" />
          <StatCard icon={<AlertTriangle size={20} />} label="Rosak" value={stats.rosak} color="red" />
          <StatCard icon={<Archive size={20} />} label="Lupus" value={stats.lupus} color="gray" />
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 border border-slate-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, no. siri, lokasi..."
                value={carian}
                onChange={e => setCarian(e.target.value)}
                className="flex-1 outline-none text-sm text-slate-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={filterKategori}
                onChange={e => setFilterKategori(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="">Semua Kategori</option>
                {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Memuatkan...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              {carian || filterKategori || filterStatus ? 'Tiada rekod dijumpai' : 'Belum ada aset didaftarkan'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">No. Aset</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Nama</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Kategori</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Lokasi</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(aset => (
                    <tr key={aset.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{aset.no_siri}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {aset.gambar_url ? (
                            <img src={aset.gambar_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package size={16} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{aset.nama}</p>
                            {aset.jenama && <p className="text-xs text-slate-400">{aset.jenama} {aset.model}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{aset.kategori || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{aset.lokasi || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[aset.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_CONFIG[aset.status]?.label || aset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQrAset(aset)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                            title="QR Kod"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => { setEditAset(aset); setShowForm(true) }}
                            className="px-3 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(aset.id)}
                            className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition"
                          >
                            Padam
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <AsetForm
          aset={editAset}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditAset(null) }}
        />
      )}

      {/* QR Modal */}
      {qrAset && (
        <QRModal
          aset={qrAset}
          onClose={() => setQrAset(null)}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red:   'bg-red-50 text-red-600',
    gray:  'bg-gray-50 text-gray-500',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}
