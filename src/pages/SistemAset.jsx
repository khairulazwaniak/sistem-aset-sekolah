import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, Search, Package, AlertTriangle, CheckCircle,
  Archive, Eye, Pencil, Trash2, School, UserCheck,
  ChevronDown, LayoutDashboard, XCircle, Wrench,
  ArrowRightLeft, FileDown, FileSpreadsheet, Printer,
  LogIn, LogOut, Clock, MapPin, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import AsetForm from '../components/AsetForm'
import QRModal from '../components/QRModal'
import PenyelenggaraanModal from '../components/PenyelenggaraanModal'
import PerpindahanModal from '../components/PerpindahanModal'
import BulkImportModal from '../components/BulkImportModal'

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',      color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  rosak:      { label: 'Rosak',      color: 'bg-red-100 text-red-700 ring-1 ring-red-200',             dot: 'bg-red-500' },
  baik_pulih: { label: 'Baik Pulih', color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-500' },
  lupus:      { label: 'Lupus',      color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',       dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     color: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',    dot: 'bg-orange-500' },
}

const KATEGORI_LIST = ['ICT', 'Perabot', 'Sukan', 'Buku', 'Elektrik', 'Lain-lain']

export default function SistemAset() {
  const [activeTab, setActiveTab]         = useState('dashboard')
  const [asetList, setAsetList]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [carian, setCarian]               = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [showForm, setShowForm]           = useState(false)
  const [editAset, setEditAset]           = useState(null)
  const [qrAset, setQrAset]               = useState(null)
  const [penyelenggaraanAset, setPenyelenggaraanAset] = useState(null)
  const [perpindahanAset, setPerpindahanAset]         = useState(null)
  const [showImport, setShowImport]                   = useState(false)
  const [pinjamanList, setPinjamanList]   = useState([])
  const [loadingPinjaman, setLoadingPinjaman] = useState(false)

  useEffect(() => { fetchAset(); fetchPinjaman() }, [])
  useEffect(() => { if (activeTab === 'pinjaman') fetchPinjaman() }, [activeTab])

  async function fetchPinjaman() {
    setLoadingPinjaman(true)
    const { data, error } = await supabase
      .from('pinjaman')
      .select('*, aset(nama, no_siri, lokasi, kategori, gambar_url)')
      .eq('status', 'aktif')
      .order('tarikh_pinjam', { ascending: false })
    if (error) toast.error('Gagal muatkan pinjaman')
    else setPinjamanList(data || [])
    setLoadingPinjaman(false)
  }

  async function handleTandaPulang(pinjaman) {
    if (!confirm(`Sahkan pulangan aset dari ${pinjaman.nama_peminjam}?`)) return
    const { error } = await supabase.from('pinjaman').update({
      status: 'dipulangkan',
      tarikh_pulang: new Date().toISOString(),
    }).eq('id', pinjaman.id)
    if (error) { toast.error('Gagal rekod pulangan'); return }
    toast.success('Aset ditandakan dipulangkan')
    fetchPinjaman()
  }

  async function fetchAset() {
    setLoading(true)
    const { data, error } = await supabase
      .from('aset').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Gagal muatkan aset')
    else setAsetList(data || [])
    setLoading(false)
  }

  function handleFormSuccess(newAset) {
    setShowForm(false); setEditAset(null)
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

  // ── Export Excel ──
  function exportExcel() {
    const rows = filtered.map((a, i) => ({
      'Bil.':                     i + 1,
      'No. Aset':                 a.no_siri,
      'Nama Aset':                a.nama,
      'Kategori':                 a.kategori || '-',
      'Jenama':                   a.jenama || '-',
      'Model':                    a.model || '-',
      'No. Siri Pembuat':         a.no_siri_pembuat || '-',
      'Pembekal':                 a.pembekal || '-',
      'No. Kontrak':              a.no_kontrak || '-',
      'Cara Diperoleh':           a.cara_diperoleh || '-',
      'Lokasi':                   a.lokasi || '-',
      'Pegawai Bertanggungjawab': a.pegawai_bertanggungjawab || '-',
      'Ketua Jabatan':            a.ketua_jabatan || '-',
      'Status':                   STATUS_CONFIG[a.status]?.label || a.status,
      'Tarikh Terima':            a.tarikh_terima ? new Date(a.tarikh_terima).toLocaleDateString('ms-MY') : '-',
      'Tarikh Penempatan':        a.tarikh_penempatan ? new Date(a.tarikh_penempatan).toLocaleDateString('ms-MY') : '-',
      'Tarikh Tamat Waranti':     a.tarikh_waranti_tamat ? new Date(a.tarikh_waranti_tamat).toLocaleDateString('ms-MY') : '-',
      'Harga Perolehan (RM)':     a.harga ? Number(a.harga).toFixed(2) : '-',
      'Nilai Semasa (RM)':        a.nilai_semasa ? Number(a.nilai_semasa).toFixed(2) : '-',
      'Spesifikasi':              a.spesifikasi || '-',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Senarai Aset')
    XLSX.writeFile(wb, `Senarai_Aset_SK_Darau_${new Date().toISOString().slice(0,10)}.xlsx`)
    toast.success('Excel dimuat turun')
  }

  // ── Export PDF (KEW.PA-7 style) ──
  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const tarikh = new Date().toLocaleDateString('ms-MY')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SENARAI ASET ALIH KERAJAAN (KEW.PA-7)', 148, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Sekolah Kebangsaan Darau', 148, 22, { align: 'center' })
    doc.text(`Tarikh Cetak: ${tarikh}`, 148, 28, { align: 'center' })

    autoTable(doc, {
      startY: 34,
      head: [['Bil.', 'No. Aset', 'Nama Aset', 'Kategori', 'Lokasi', 'Status', 'Tarikh Terima', 'Harga (RM)']],
      body: filtered.map((a, i) => [
        i + 1,
        a.no_siri,
        a.nama,
        a.kategori || '-',
        a.lokasi || '-',
        STATUS_CONFIG[a.status]?.label || a.status,
        a.tarikh_terima ? new Date(a.tarikh_terima).toLocaleDateString('ms-MY') : '-',
        a.harga ? `RM ${Number(a.harga).toFixed(2)}` : '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 153], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 244, 248] },
    })

    doc.setFontSize(8)
    doc.text(`Guru Aset: Khairul Azwani bin Haji Ahinin`, 14, doc.lastAutoTable.finalY + 10)
    doc.text(`Jumlah Rekod: ${filtered.length}`, 14, doc.lastAutoTable.finalY + 16)

    doc.save(`KEW_PA7_SK_Darau_${new Date().toISOString().slice(0,10)}.pdf`)
    toast.success('PDF dimuat turun')
  }

  // ── Print Senarai ──
  function printSenarai() {
    const tarikh = new Date().toLocaleDateString('ms-MY')
    const rows = filtered.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><code>${a.no_siri}</code></td>
        <td>${a.nama}</td>
        <td>${a.kategori || '-'}</td>
        <td>${a.lokasi || '-'}</td>
        <td>${STATUS_CONFIG[a.status]?.label || a.status}</td>
        <td>${a.tarikh_terima ? new Date(a.tarikh_terima).toLocaleDateString('ms-MY') : '-'}</td>
        <td>${a.harga ? `RM ${Number(a.harga).toFixed(2)}` : '-'}</td>
      </tr>`).join('')

    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Senarai Aset SK Darau</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        h2 { text-align: center; font-size: 14px; margin-bottom: 4px; }
        p.sub { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #003399; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 5px 8px; }
        tr:nth-child(even) td { background: #f8fafc; }
        code { font-family: monospace; font-size: 10px; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; }
        @media print { body { margin: 10px; } }
      </style></head>
      <body>
        <h2>SENARAI ASET ALIH — SEKOLAH KEBANGSAAN DARAU</h2>
        <p class="sub">Tarikh Cetak: ${tarikh} &nbsp;|&nbsp; Jumlah: ${filtered.length} rekod</p>
        <table>
          <thead><tr>
            <th>Bil.</th><th>No. Aset</th><th>Nama Aset</th><th>Kategori</th>
            <th>Lokasi</th><th>Status</th><th>Tarikh Terima</th><th>Harga</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Guru Aset: Khairul Azwani bin Haji Ahinin</p>
          <p>Tandatangan: _____________________________ &nbsp;&nbsp; Tarikh: ______________</p>
        </div>
      </body></html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ── Top Banner ── */}
      <div className="bg-linear-to-r from-[#003399] via-[#0055cc] to-[#0077ff] text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-5">
          <img src="https://i.postimg.cc/pdhvk3Q2/images.jpg" alt="Logo SK Darau"
            className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shrink-0" />
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
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === 'dashboard' ? 'text-white border-white' : 'text-blue-200 border-transparent hover:text-white'}`}>
              <LayoutDashboard size={15} />
              Dashboard Aset
            </button>
            <button onClick={() => setActiveTab('pinjaman')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === 'pinjaman' ? 'text-white border-white' : 'text-blue-200 border-transparent hover:text-white'}`}>
              <LogIn size={15} />
              Log Pinjaman
              {pinjamanList.length > 0 && (
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">{pinjamanList.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Jumlah Aset"  value={stats.jumlah}     icon={<Package size={22} />}      gradient="from-blue-600 to-blue-500" />
          <StatCard label="Aset Aktif"   value={stats.aktif}      icon={<CheckCircle size={22} />}  gradient="from-emerald-600 to-emerald-500" />
          <StatCard label="Rosak"        value={stats.rosak}      icon={<XCircle size={22} />}      gradient="from-red-600 to-red-500" />
          <StatCard label="Baik Pulih"   value={stats.baik_pulih} icon={<Wrench size={22} />}       gradient="from-amber-600 to-amber-500" />
        </div>

        {/* ── Log Pinjaman Tab ── */}
        {activeTab === 'pinjaman' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Aset Sedang Dipinjam</h2>
                <p className="text-xs text-slate-400">{pinjamanList.length} aset belum dipulangkan</p>
              </div>
              <button onClick={fetchPinjaman}
                className="text-xs text-blue-600 hover:underline">Muat semula</button>
            </div>

            {loadingPinjaman ? (
              <div className="py-16 text-center text-slate-400 text-sm">Memuatkan...</div>
            ) : pinjamanList.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle size={40} className="text-emerald-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Tiada aset sedang dipinjam</p>
                <p className="text-slate-300 text-xs mt-1">Semua aset ada di tempat masing-masing</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pinjamanList.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/30 transition">
                    {/* Gambar aset */}
                    {p.aset?.gambar_url ? (
                      <img src={p.aset.gambar_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Package size={18} className="text-slate-400" />
                      </div>
                    )}

                    {/* Info aset */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.aset?.nama || '—'}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="font-mono text-xs text-slate-400">{p.aset?.no_siri}</span>
                        {p.aset?.lokasi && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={10} /> {p.aset.lokasi}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info peminjam */}
                    <div className="hidden md:block text-right min-w-36">
                      <div className="flex items-center justify-end gap-1.5">
                        <User size={12} className="text-amber-500" />
                        <p className="text-sm font-semibold text-amber-800">{p.nama_peminjam}</p>
                      </div>
                      {p.jawatan && <p className="text-xs text-slate-400">{p.jawatan}</p>}
                      <div className="flex items-center justify-end gap-1 mt-1 text-xs text-slate-400">
                        <Clock size={10} />
                        {new Date(p.tarikh_pinjam).toLocaleString('ms-MY')}
                      </div>
                    </div>

                    {/* Butang pulang */}
                    <button onClick={() => handleTandaPulang(p)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-50 transition shrink-0">
                      <LogOut size={13} />
                      Pulangkan
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">SK Darau · Sistem Pengurusan Aset</p>
            </div>
          </div>
        )}

        {/* ── Table Card ── */}
        {activeTab === 'dashboard' && <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Senarai Aset</h2>
              <p className="text-xs text-slate-400">{filtered.length} rekod dijumpai</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-52">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input type="text" placeholder="Cari nama, no. siri, lokasi..."
                  value={carian} onChange={e => setCarian(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
              </div>
              {/* Filter */}
              <div className="relative">
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-700 outline-none cursor-pointer">
                  <option value="">Semua Kategori</option>
                  {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-700 outline-none cursor-pointer">
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
              {/* Export buttons */}
              <button onClick={() => setShowImport(true)} title="Import Excel"
                className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 bg-blue-50 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition">
                <FileSpreadsheet size={15} /> Import
              </button>
              <button onClick={printSenarai} title="Print Senarai"
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                <Printer size={15} /> Print
              </button>
              <button onClick={exportExcel} title="Export Excel"
                className="flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-xl text-sm text-emerald-700 hover:bg-emerald-100 transition">
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button onClick={exportPDF} title="Export PDF KEW.PA-7"
                className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 rounded-xl text-sm text-red-700 hover:bg-red-100 transition">
                <FileDown size={15} /> PDF
              </button>
              {/* Tambah */}
              <button onClick={() => { setEditAset(null); setShowForm(true) }}
                className="flex items-center gap-2 bg-[#003399] hover:bg-[#002277] text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-200">
                <Plus size={16} /> Tambah Aset
              </button>
            </div>
          </div>

          {/* Table */}
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
                    {['No. Aset','Aset','Kategori','Lokasi','Status','Tindakan'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
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
                        {aset.kategori
                          ? <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{aset.kategori}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-sm">{aset.lokasi || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[aset.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[aset.status]?.dot}`} />
                          {STATUS_CONFIG[aset.status]?.label || aset.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <ActionBtn title="QR / Dokumen"   color="hover:bg-blue-100 hover:text-blue-600"   icon={<Eye size={14} />}           onClick={() => setQrAset(aset)} />
                          <ActionBtn title="Penyelenggaraan" color="hover:bg-amber-100 hover:text-amber-600" icon={<Wrench size={14} />}         onClick={() => setPenyelenggaraanAset(aset)} />
                          <ActionBtn title="Perpindahan"    color="hover:bg-purple-100 hover:text-purple-600" icon={<ArrowRightLeft size={14} />} onClick={() => setPerpindahanAset(aset)} />
                          <ActionBtn title="Edit"           color="hover:bg-slate-100 hover:text-slate-700"  icon={<Pencil size={14} />}         onClick={() => { setEditAset(aset); setShowForm(true) }} />
                          <ActionBtn title="Padam"          color="hover:bg-red-100 hover:text-red-600"      icon={<Trash2 size={14} />}         onClick={() => handleDelete(aset.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">SK Darau · Sistem Pengurusan Aset</p>
            <p className="text-xs text-slate-400">Guru Aset: Khairul Azwani bin Haji Ahinin</p>
          </div>
        </div>}
      </div>

      {showForm && <AsetForm aset={editAset} onSuccess={handleFormSuccess} onClose={() => { setShowForm(false); setEditAset(null) }} />}
      {qrAset && <QRModal aset={qrAset} onClose={() => setQrAset(null)} />}
      {penyelenggaraanAset && <PenyelenggaraanModal aset={penyelenggaraanAset} onClose={() => setPenyelenggaraanAset(null)} />}
      {perpindahanAset && <PerpindahanModal aset={perpindahanAset} onClose={() => setPerpindahanAset(null)} onPindah={fetchAset} />}
      {showImport && <BulkImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); fetchAset() }} />}
    </div>
  )
}

function StatCard({ label, value, icon, gradient }) {
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

function ActionBtn({ title, color, icon, onClick }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg text-slate-400 transition ${color}`}>
      {icon}
    </button>
  )
}
