import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const JENIS_LIST = [
  { value: 'surat_beranak', label: 'Surat Beranak' },
  { value: 'invois',        label: 'Invois' },
  { value: 'waranti',       label: 'Waranti' },
  { value: 'surat_terima',  label: 'Surat Terima' },
  { value: 'lain',          label: 'Lain-lain' },
]

export default function DokumenUpload({ asetId }) {
  const [dokumen, setDokumen] = useState([])
  const [uploading, setUploading] = useState(false)
  const [jenis, setJenis] = useState('surat_beranak')
  const [catatan, setCatatan] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (asetId) fetchDokumen()
  }, [asetId])

  async function fetchDokumen() {
    const { data } = await supabase
      .from('dokumen_aset')
      .select('*')
      .eq('aset_id', asetId)
      .order('tarikh_upload', { ascending: false })
    setDokumen(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fail terlalu besar (max 10MB)')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${asetId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('aset-dokumen')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('aset-dokumen')
        .getPublicUrl(path)

      const { error: dbError } = await supabase.from('dokumen_aset').insert({
        aset_id:     asetId,
        jenis,
        nama_fail:   file.name,
        fail_url:    publicUrl,
        catatan:     catatan || null,
      })

      if (dbError) throw dbError

      toast.success('Dokumen dimuat naik')
      setCatatan('')
      e.target.value = ''
      fetchDokumen()
    } catch (err) {
      toast.error('Gagal muat naik dokumen')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(dok) {
    if (!confirm(`Padam "${dok.nama_fail}"?`)) return
    const { error } = await supabase.from('dokumen_aset').delete().eq('id', dok.id)
    if (error) {
      toast.error('Gagal padam')
    } else {
      toast.success('Dokumen dipadam')
      fetchDokumen()
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Muat Naik Dokumen</p>
        <div className="flex gap-2">
          <select
            value={jenis}
            onChange={e => setJenis(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            {JENIS_LIST.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Catatan (pilihan)"
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 w-full justify-center py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Memuat naik...' : 'Pilih PDF / Gambar'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Senarai dokumen */}
      {dokumen.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dokumen Tersimpan</p>
          {dokumen.map(dok => (
            <div key={dok.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl">
              <FileText size={18} className="text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{dok.nama_fail}</p>
                <p className="text-xs text-slate-400">
                  {JENIS_LIST.find(j => j.value === dok.jenis)?.label || dok.jenis}
                  {dok.catatan && ` · ${dok.catatan}`}
                </p>
              </div>
              <a href={dok.fail_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition">
                <ExternalLink size={14} />
              </a>
              <button onClick={() => handleDelete(dok)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {dokumen.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">Tiada dokumen lagi</p>
      )}
    </div>
  )
}
