import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Plus, ArrowRightLeft, Loader2, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  tarikh: '', lokasi_baru: '', sebab: '', nama_pegawai: '',
}

export default function PerpindahanModal({ aset, onClose, onPindah }) {
  const [rekod, setRekod] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY, lokasi_lama: aset.lokasi || '' })

  useEffect(() => { fetchRekod() }, [])

  async function fetchRekod() {
    setLoading(true)
    const { data } = await supabase
      .from('perpindahan')
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
    if (!form.tarikh || !form.lokasi_baru) {
      toast.error('Tarikh dan lokasi baru diperlukan')
      return
    }
    setSaving(true)
    try {
      const { error: pindahError } = await supabase.from('perpindahan').insert({
        ...form,
        aset_id: aset.id,
        lokasi_lama: form.lokasi_lama || aset.lokasi || '-',
      })
      if (pindahError) throw pindahError

      const { error: updateError } = await supabase
        .from('aset')
        .update({ lokasi: form.lokasi_baru })
        .eq('id', aset.id)
      if (updateError) throw updateError

      toast.success('Aset dipindahkan')
      setForm({ ...EMPTY, lokasi_lama: form.lokasi_baru })
      setShowForm(false)
      fetchRekod()
      if (onPindah) onPindah()
    } catch {
      toast.error('Gagal simpan perpindahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Padam rekod ini?')) return
    const { error } = await supabase.from('perpindahan').delete().eq('id', id)
    if (error) toast.error('Gagal padam')
    else { toast.success('Dipadam'); fetchRekod() }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-500" />
              Sejarah Perpindahan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{aset.nama} · {aset.no_siri}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Lokasi semasa */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <MapPin size={16} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-blue-500">Lokasi Semasa</p>
              <p className="text-sm font-semibold text-blue-800">{aset.lokasi || 'Tidak ditetapkan'}</p>
            </div>
          </div>

          {/* Tambah button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition"
            >
              <Plus size={15} />
              Rekod Perpindahan Baru
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Perpindahan Baru</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Lokasi Lama</label>
                  <input type="text" name="lokasi_lama" value={form.lokasi_lama} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Lokasi Baru *</label>
                  <input type="text" name="lokasi_baru" value={form.lokasi_baru} onChange={handleChange}
                    required placeholder="Bilik Komputer 2"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Tarikh *</label>
                  <input type="date" name="tarikh" value={form.tarikh} onChange={handleChange} required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Pegawai</label>
                  <input type="text" name="nama_pegawai" value={form.nama_pegawai} onChange={handleChange}
                    placeholder="Guru Aset"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Sebab Perpindahan</label>
                <input type="text" name="sebab" value={form.sebab} onChange={handleChange}
                  placeholder="Bilik dirombak, penempatan semula..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">Batal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Simpan & Pindah
                </button>
              </div>
            </form>
          )}

          {/* Senarai */}
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-4">Memuatkan...</p>
          ) : rekod.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Tiada rekod perpindahan</p>
          ) : (
            <div className="space-y-2">
              {rekod.map(r => (
                <div key={r.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 text-sm">
                        <span className="font-medium text-slate-600">{r.lokasi_lama || '—'}</span>
                        <ArrowRightLeft size={13} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{r.lokasi_baru}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>📅 {new Date(r.tarikh).toLocaleDateString('ms-MY')}</span>
                        {r.nama_pegawai && <span>👤 {r.nama_pegawai}</span>}
                        {r.sebab && <span>📝 {r.sebab}</span>}
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
