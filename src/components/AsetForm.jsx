import { useState, useRef } from 'react'
import { supabase, generateNoAset } from '../lib/supabase'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const KATEGORI_LIST = ['ICT', 'Perabot', 'Sukan', 'Buku', 'Elektrik', 'Lain-lain']
const STATUS_LIST = [
  { value: 'aktif',      label: 'Aktif' },
  { value: 'rosak',      label: 'Rosak' },
  { value: 'baik_pulih', label: 'Baik Pulih' },
  { value: 'lupus',      label: 'Lupus' },
  { value: 'hilang',     label: 'Hilang' },
]

export default function AsetForm({ aset, onSuccess, onClose }) {
  const isEdit = !!aset
  const [loading, setLoading] = useState(false)
  const [uploadingGambar, setUploadingGambar] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(aset?.gambar_url || null)
  const fileRef = useRef()

  const [form, setForm] = useState({
    no_siri:       aset?.no_siri || '',
    nama:          aset?.nama || '',
    kategori:      aset?.kategori || 'ICT',
    jenama:        aset?.jenama || '',
    model:         aset?.model || '',
    tarikh_terima: aset?.tarikh_terima || '',
    harga:         aset?.harga || '',
    lokasi:        aset?.lokasi || '',
    status:        aset?.status || 'aktif',
    gambar_url:    aset?.gambar_url || '',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleGambar(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Gambar terlalu besar (max 5MB)')
      return
    }

    setUploadingGambar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('aset-gambar')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error(`Error: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('aset-gambar')
        .getPublicUrl(path)

      setForm(f => ({ ...f, gambar_url: publicUrl }))
      setPreviewUrl(publicUrl)
      toast.success('Gambar dimuat naik')
    } catch (err) {
      toast.error('Gagal muat naik gambar')
    } finally {
      setUploadingGambar(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nama.trim()) {
      toast.error('Nama aset diperlukan')
      return
    }

    setLoading(true)
    try {
      let result
      if (isEdit) {
        const { data, error } = await supabase
          .from('aset')
          .update(form)
          .eq('id', aset.id)
          .select()
          .single()
        if (error) throw error
        result = data
        toast.success('Aset dikemaskini')
      } else {
        const noSiri = form.no_siri || generateNoAset(form.kategori)
        const { data, error } = await supabase
          .from('aset')
          .insert({ ...form, no_siri: noSiri })
          .select()
          .single()
        if (error) throw error
        result = data
        toast.success('Aset didaftarkan')
      }
      onSuccess(result)
    } catch (err) {
      toast.error(err.message || 'Gagal simpan aset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Kemaskini Aset' : 'Daftar Aset Baru'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Gambar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gambar Aset</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition flex items-center gap-4"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center">
                  <ImageIcon size={24} className="text-slate-400" />
                </div>
              )}
              <div>
                {uploadingGambar ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 size={16} className="animate-spin" />
                    Memuat naik...
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Upload size={14} />
                      {previewUrl ? 'Tukar gambar' : 'Muat naik gambar'}
                    </p>
                    <p className="text-xs text-slate-400">JPG, PNG — max 5MB</p>
                  </>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleGambar} />
          </div>

          {/* Row: No Siri + Nama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="No. Aset (auto-jana jika kosong)" name="no_siri" value={form.no_siri} onChange={handleChange} placeholder="ASET/ICT/2024/001" />
            <Field label="Nama Aset *" name="nama" value={form.nama} onChange={handleChange} placeholder="Laptop Dell Latitude" required />
          </div>

          {/* Row: Kategori + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select name="kategori" value={form.kategori} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Jenama + Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Jenama" name="jenama" value={form.jenama} onChange={handleChange} placeholder="Dell" />
            <Field label="Model" name="model" value={form.model} onChange={handleChange} placeholder="Latitude 5520" />
          </div>

          {/* Row: Tarikh + Harga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tarikh Terima" name="tarikh_terima" value={form.tarikh_terima} onChange={handleChange} type="date" />
            <Field label="Harga (RM)" name="harga" value={form.harga} onChange={handleChange} type="number" placeholder="0.00" />
          </div>

          {/* Lokasi */}
          <Field label="Lokasi" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Bilik Guru, Bilik Komputer..." />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading || uploadingGambar} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Kemaskini' : 'Daftar Aset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition"
      />
    </div>
  )
}
