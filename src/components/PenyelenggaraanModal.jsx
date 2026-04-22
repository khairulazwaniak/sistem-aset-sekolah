import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Plus, Wrench, Loader2, Trash2, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const JENIS_LIST = [
  { value: 'pembaikan',              label: 'Pembaikan' },
  { value: 'penyelenggaraan_rutin',  label: 'Penyelenggaraan Rutin' },
  { value: 'penggantian_alat_ganti', label: 'Penggantian Alat Ganti' },
  { value: 'naik_taraf',             label: 'Naik Taraf' },
]

const STATUS_CONFIG = {
  selesai:      { label: 'Selesai',      color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} /> },
  dalam_proses: { label: 'Dalam Proses', color: 'bg-amber-100 text-amber-700',    icon: <Clock size={12} /> },
}

const EMPTY = {
  tarikh: '', jenis: 'pembaikan', deskripsi: '',
  kos: '', nama_teknisyen: '', syarikat: '', status: 'selesai',
}

export default function PenyelenggaraanModal({ aset, onClose }) {
  const [rekod, setRekod] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { fetchRekod() }, [])

  async function fetchRekod() {
    setLoading(true)
    const { data } = await supabase
      .from('penyelenggaraan')
      .select('*')
      .eq('aset_id', aset.id)
      .order('tarikh', { ascending: false })
    setRekod(data || [])
    setLoading(false)
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tarikh) { toast.error('Tarikh diperlukan'); return }
    setSaving(true)
    const { error } = await supabase.from('penyelenggaraan').insert({
      ...form,
      aset_id: aset.id,
      kos: form.kos || null,
    })
    if (error) {
      toast.error('Gagal simpan')
    } else {
      toast.success('Rekod disimpan')
      setForm(EMPTY)
      setShowForm(false)
      fetchRekod()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Padam rekod ini?')) return
    const { error } = await supabase.from('penyelenggaraan').delete().eq('id', id)
    if (error) toast.error('Gagal padam')
    else { toast.success('Dipadam'); fetchRekod() }
  }

  const jumlahKos = rekod.reduce((sum, r) => sum + (Number(r.kos) || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wrench size={18} className="text-amber-500" />
              Log Penyelenggaraan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{aset.nama} · {aset.no_siri}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{rekod.length}</p>
              <p className="text-xs text-amber-600">Jumlah Rekod</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">RM {jumlahKos.toFixed(2)}</p>
              <p className="text-xs text-blue-600">Jumlah Kos</p>
            </div>
          </div>

          {/* Tambah button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition"
            >
              <Plus size={15} />
              Tambah Rekod Penyelenggaraan
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Rekod Baru</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Tarikh *</label>
                  <input type="date" name="tarikh" value={form.tarikh} onChange={handleChange} required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Jenis</label>
                  <select name="jenis" value={form.jenis} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
                    {JENIS_LIST.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Teknisyen</label>
                  <input type="text" name="nama_teknisyen" value={form.nama_teknisyen} onChange={handleChange} placeholder="Ahmad bin Ali"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Syarikat</label>
                  <input type="text" name="syarikat" value={form.syarikat} onChange={handleChange} placeholder="Syarikat XYZ"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Kos (RM)</label>
                  <input type="number" name="kos" value={form.kos} onChange={handleChange} placeholder="0.00" step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
                    <option value="selesai">Selesai</option>
                    <option value="dalam_proses">Dalam Proses</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Deskripsi / Catatan</label>
                <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={2} placeholder="Huraikan kerja yang dilakukan..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">Batal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          )}

          {/* Senarai rekod */}
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-4">Memuatkan...</p>
          ) : rekod.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Tiada rekod penyelenggaraan</p>
          ) : (
            <div className="space-y-2">
              {rekod.map(r => (
                <div key={r.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {JENIS_LIST.find(j => j.value === r.jenis)?.label || r.jenis}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status]?.color}`}>
                          {STATUS_CONFIG[r.status]?.icon}
                          {STATUS_CONFIG[r.status]?.label}
                        </span>
                      </div>
                      {r.deskripsi && <p className="text-xs text-slate-500 mb-2">{r.deskripsi}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>📅 {new Date(r.tarikh).toLocaleDateString('ms-MY')}</span>
                        {r.nama_teknisyen && <span>👤 {r.nama_teknisyen}</span>}
                        {r.syarikat && <span>🏢 {r.syarikat}</span>}
                        {r.kos && <span className="font-medium text-blue-600">RM {Number(r.kos).toFixed(2)}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
