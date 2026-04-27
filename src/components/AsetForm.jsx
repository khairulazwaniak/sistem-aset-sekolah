import { useState, useRef } from 'react'
import { supabase, generateNoAset } from '../lib/supabase'
import { X, Upload, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const KATEGORI_LIST = ['ICT', 'Perabot', 'Sukan', 'Buku', 'Elektrik', 'Lain-lain']
const STATUS_LIST   = ['aktif','rosak','baik_pulih','lupus','hilang']
const STATUS_LABEL  = { aktif:'Aktif', rosak:'Rosak', baik_pulih:'Baik Pulih', lupus:'Lupus', hilang:'Hilang' }
const CARA_LIST     = ['Beli','Sewa-Beli','Hadiah','Pindahan','Peruntukan','Lain-lain']

const SECTIONS = [
  { id:'asas',           label:'Maklumat Asas' },
  { id:'perolehan',      label:'Perolehan' },
  { id:'tanggungjawab',  label:'Tanggungjawab' },
  { id:'lain',           label:'Spesifikasi' },
]

const BLANK = {
  no_siri:'', nama:'', kategori:'ICT', jenama:'', model:'',
  no_siri_pembuat:'', pembekal:'', no_kontrak:'',
  cara_diperoleh:'Beli', cara_perolehan:'Sewa-Beli',
  tarikh_terima:'', tarikh_penempatan:'', tarikh_waranti_tamat:'',
  tempoh_jaminan:'', harga:'', nilai_semasa:'',
  lokasi:'', pegawai:'', pegawai_bertanggungjawab:'', ketua_jabatan:'',
  spesifikasi:'', status:'aktif', gambar_url:'',
}

export default function AsetForm({ aset, onSuccess, onClose }) {
  const isEdit = !!aset
  const [saving, setSaving]           = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [preview, setPreview]         = useState(aset?.gambar_url || null)
  const [tab, setTab]                 = useState('asas')
  const fileRef                       = useRef()

  const [form, setForm] = useState(() =>
    aset ? { ...BLANK, ...aset } : { ...BLANK }
  )

  function set(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleGambar(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const path = `${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('aset-gambar').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('aset-gambar').getPublicUrl(path)
      setForm(f => ({ ...f, gambar_url: publicUrl }))
      setPreview(publicUrl)
      toast.success('Gambar dimuat naik')
    } catch (err) { toast.error(`Error: ${err.message}`) }
    finally { setUploading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nama.trim()) { toast.error('Nama aset diperlukan'); return }
    setSaving(true)
    try {
      const payload = { ...form, harga: form.harga || null, nilai_semasa: form.nilai_semasa || null }
      let result
      if (isEdit) {
        const { data, error } = await supabase.from('aset').update(payload).eq('id', aset.id).select().single()
        if (error) throw error
        result = data; toast.success('Dikemaskini')
      } else {
        const no_siri = form.no_siri || generateNoAset(form.kategori)
        const { data, error } = await supabase.from('aset').insert({ ...payload, no_siri }).select().single()
        if (error) throw error
        result = data; toast.success('Aset didaftarkan')
      }
      onSuccess(result)
    } catch (err) { toast.error(err.message || 'Gagal simpan') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">{isEdit ? 'Kemaskini Aset' : 'Daftar Aset Baru'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 overflow-x-auto">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab===s.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">

            {/* ── ASAS ── */}
            {tab === 'asas' && <>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition flex items-center gap-4">
                {preview
                  ? <img src={preview} className="w-20 h-20 rounded-xl object-cover" />
                  : <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center"><ImageIcon size={24} className="text-slate-400"/></div>}
                <div>
                  {uploading
                    ? <p className="text-sm text-blue-600 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/>Memuat naik...</p>
                    : <><p className="text-sm font-medium text-slate-700 flex gap-1"><Upload size={14}/>{preview ? 'Tukar gambar' : 'Muat naik gambar'}</p><p className="text-xs text-slate-400">JPG, PNG — max 5MB</p></>}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleGambar}/>

              <Row><F label="No. Aset (auto-jana)" name="no_siri" value={form.no_siri} onChange={set} placeholder="ASET/ICT/2024/001"/>
                   <F label="Nama Aset *" name="nama" value={form.nama} onChange={set} required/></Row>
              <Row><Sel label="Kategori" name="kategori" value={form.kategori} onChange={set} opts={KATEGORI_LIST}/>
                   <Sel label="Status" name="status" value={form.status} onChange={set}
                     opts={STATUS_LIST.map(s => ({ value:s, label:STATUS_LABEL[s] }))}/></Row>
              <Row><F label="Jenama" name="jenama" value={form.jenama} onChange={set} placeholder="Dell, HP..."/>
                   <F label="Model" name="model" value={form.model} onChange={set} placeholder="Latitude 5520"/></Row>
              <F label="No. Siri Pembuat (Serial Number)" name="no_siri_pembuat" value={form.no_siri_pembuat} onChange={set} placeholder="SN1234567890"/>
            </>}

            {/* ── PEROLEHAN ── */}
            {tab === 'perolehan' && <>
              <Row><Sel label="Cara Perolehan" name="cara_perolehan" value={form.cara_perolehan} onChange={set} opts={['Beli','Sewa-Beli','Hadiah','Pindahan','Peruntukan','Lain-lain']}/>
                   <F label="Pembekal / Vendor" name="pembekal" value={form.pembekal} onChange={set} placeholder="Syarikat ABC Sdn Bhd"/></Row>
              <F label="No. Kontrak / Pesanan Kerajaan" name="no_kontrak" value={form.no_kontrak} onChange={set} placeholder="KPM-ICT-2024-001"/>
              <Row><F label="Tarikh Terima" name="tarikh_terima" value={form.tarikh_terima} onChange={set} type="date"/>
                   <F label="Tarikh Penempatan" name="tarikh_penempatan" value={form.tarikh_penempatan} onChange={set} type="date"/></Row>
              <Row><F label="Harga Perolehan (RM)" name="harga" value={form.harga} onChange={set} type="number" placeholder="0.00"/>
                   <F label="Nilai Semasa (RM)" name="nilai_semasa" value={form.nilai_semasa} onChange={set} type="number" placeholder="0.00"/></Row>
              <Row><F label="Tempoh Jaminan / Waranti" name="tempoh_jaminan" value={form.tempoh_jaminan} onChange={set} placeholder="3 Tahun"/>
                   <F label="Tarikh Tamat Waranti" name="tarikh_waranti_tamat" value={form.tarikh_waranti_tamat} onChange={set} type="date"/></Row>
            </>}

            {/* ── TANGGUNGJAWAB ── */}
            {tab === 'tanggungjawab' && <>
              <F label="Lokasi Penempatan" name="lokasi" value={form.lokasi} onChange={set} placeholder="Bilik Komputer 1, Bilik Guru..."/>
              <F label="Pegawai Bertanggungjawab (Dalam Jagaan)" name="pegawai" value={form.pegawai} onChange={set} placeholder="Nama guru / pengguna aset"/>
              <F label="Pegawai Aset" name="pegawai_bertanggungjawab" value={form.pegawai_bertanggungjawab} onChange={set} placeholder="Khairul Azwani bin Haji Ahinin"/>
              <F label="Ketua Jabatan" name="ketua_jabatan" value={form.ketua_jabatan} onChange={set} placeholder="Nama GPK / Ketua Jabatan"/>
            </>}

            {/* ── SPESIFIKASI ── */}
            {tab === 'lain' && <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spesifikasi / Catatan Teknikal</label>
                <textarea name="spesifikasi" value={form.spesifikasi} onChange={set} rows={6}
                  placeholder="Intel Core i5, 8GB RAM, 256GB SSD, Windows 11 Pro..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"/>
              </div>
            </>}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Batal</button>
            <button type="submit" disabled={saving || uploading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin"/>}
              {isEdit ? 'Kemaskini' : 'Daftar Aset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Row({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div> }

function F({ label, name, value, onChange, type='text', placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition bg-white"/>
    </div>
  )
}

function Sel({ label, name, value, onChange, opts }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange}
          className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none focus:border-blue-400 bg-white">
          {opts.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
      </div>
    </div>
  )
}
