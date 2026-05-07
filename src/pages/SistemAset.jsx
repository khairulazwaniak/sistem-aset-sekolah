import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, Search, Package, CheckCircle,
  Eye, Pencil, Trash2, UserCheck,
  ChevronDown, LayoutDashboard, XCircle, Wrench,
  ArrowRightLeft, FileDown, FileSpreadsheet, Printer,
  LogIn, LogOut, Clock, MapPin, User, FileText,
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
  aktif:      { label: 'Aktif',      color: 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30', dot: 'bg-emerald-400' },
  rosak:      { label: 'Rosak',      color: 'bg-rose-400/20 text-rose-300 ring-1 ring-rose-400/30',           dot: 'bg-rose-400' },
  baik_pulih: { label: 'Baik Pulih', color: 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30',       dot: 'bg-amber-400' },
  lupus:      { label: 'Lupus',      color: 'bg-slate-400/20 text-slate-400 ring-1 ring-slate-400/30',       dot: 'bg-slate-400' },
  hilang:     { label: 'Hilang',     color: 'bg-orange-400/20 text-orange-300 ring-1 ring-orange-400/30',    dot: 'bg-orange-400' },
}

const KATEGORI_LIST = ['ICT', 'Perabot', 'Sukan', 'Buku', 'Elektrik', 'Lain-lain']

/* ─── Chibi mascot SVG ─── */
function ChibiMascot({ className = '', style = {} }) {
  return (
    <svg viewBox="0 0 80 90" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="40" cy="84" rx="16" ry="7" fill="#5b21b6" opacity="0.85"/>
      <rect x="27" y="68" width="26" height="18" rx="9" fill="#6d28d9"/>
      <text x="40" y="82" textAnchor="middle" fontSize="9" fill="#c4b5fd">★</text>
      {/* Arms */}
      <ellipse cx="20" cy="72" rx="10" ry="6" fill="#fde68a" transform="rotate(-20 20 72)"/>
      <ellipse cx="60" cy="72" rx="10" ry="6" fill="#fde68a" transform="rotate(20 60 72)"/>
      {/* Head */}
      <circle cx="40" cy="40" r="30" fill="#fde68a"/>
      {/* Hair */}
      <path d="M11 40 Q13 12 40 10 Q67 12 69 40 Q65 24 40 22 Q15 24 11 40Z" fill="#4c1d95"/>
      <circle cx="40" cy="9"  r="7"  fill="#4c1d95"/>
      <circle cx="27" cy="12" r="6"  fill="#4c1d95"/>
      <circle cx="53" cy="12" r="6"  fill="#4c1d95"/>
      <ellipse cx="13" cy="43" rx="6" ry="9" fill="#4c1d95"/>
      <ellipse cx="67" cy="43" rx="6" ry="9" fill="#4c1d95"/>
      {/* Grad cap */}
      <rect x="27" y="11" width="26" height="5" rx="2" fill="#1e1b4b"/>
      <polygon points="40,4 27,11 53,11" fill="#2e1065"/>
      <circle cx="53" cy="11" r="2.5" fill="#fbbf24"/>
      <line x1="53" y1="11" x2="57" y2="20" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="57" cy="21" r="3" fill="#fbbf24"/>
      {/* Eyes white */}
      <circle cx="31" cy="39" r="10" fill="white"/>
      <circle cx="49" cy="39" r="10" fill="white"/>
      {/* Pupils */}
      <circle cx="32" cy="40" r="6.5" fill="#1e1b4b"/>
      <circle cx="50" cy="40" r="6.5" fill="#1e1b4b"/>
      {/* Shine */}
      <circle cx="34" cy="38" r="2.8" fill="white"/>
      <circle cx="52" cy="38" r="2.8" fill="white"/>
      <circle cx="35" cy="41" r="1.2" fill="white"/>
      <circle cx="53" cy="41" r="1.2" fill="white"/>
      {/* Blush */}
      <circle cx="20" cy="47" r="7.5" fill="#f9a8d4" opacity="0.55"/>
      <circle cx="60" cy="47" r="7.5" fill="#f9a8d4" opacity="0.55"/>
      <line x1="15" y1="46" x2="24" y2="46" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="15" y1="48" x2="24" y2="48" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="56" y1="46" x2="65" y2="46" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="56" y1="48" x2="65" y2="48" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      {/* Smile */}
      <path d="M32 53 Q40 61 48 53" stroke="#92400e" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

/* ─── Floating star decoration ─── */
function Stars() {
  return (
    <>
      <span className="absolute top-3 right-3 text-yellow-300 star-1" style={{ fontSize: 14 }}>✦</span>
      <span className="absolute top-8 right-8 text-pink-300 star-3" style={{ fontSize: 9 }}>✦</span>
      <span className="absolute bottom-4 left-4 text-purple-300 star-5" style={{ fontSize: 11 }}>✦</span>
    </>
  )
}

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

  function janaSuratPinjaman(p) {
    const tarikh = new Date(p.tarikh_pinjam).toLocaleDateString('ms-MY', { day:'2-digit', month:'long', year:'numeric' })
    const masa   = new Date(p.tarikh_pinjam).toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit' })
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Borang Pinjaman Aset</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; padding: 40px 50px; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 3px double #000; padding-bottom: 16px; }
        .header h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .header h2 { font-size: 13pt; font-weight: bold; margin-top: 4px; }
        .header p  { font-size: 11pt; margin-top: 2px; }
        .tajuk { text-align: center; margin: 20px 0; }
        .tajuk h3 { font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 2px; }
        .no-ref { text-align: right; font-size: 11pt; margin-bottom: 16px; }
        table.info { width: 100%; border-collapse: collapse; margin: 16px 0; }
        table.info td { padding: 6px 8px; vertical-align: top; font-size: 12pt; }
        table.info td:first-child { width: 38%; font-weight: normal; }
        table.info td:nth-child(2) { width: 4%; text-align: center; }
        table.info td:last-child { font-weight: bold; }
        .section-title { font-weight: bold; text-decoration: underline; margin: 20px 0 8px; font-size: 12pt; }
        .akuan { margin: 20px 0; line-height: 1.8; text-align: justify; }
        .tandatangan { display: flex; justify-content: space-between; margin-top: 48px; gap: 40px; }
        .ttd-box { flex: 1; text-align: center; }
        .ttd-line { border-bottom: 1px solid #000; margin-bottom: 6px; height: 60px; }
        .ttd-label { font-size: 11pt; }
        .ttd-name  { font-size: 12pt; font-weight: bold; margin-top: 4px; }
        .ttd-jawatan { font-size: 11pt; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #999; font-size: 10pt; color: #555; text-align: center; }
        @media print { body { padding: 20px 30px; } }
      </style></head>
      <body>
        <div class="header">
          <h1>Sekolah Kebangsaan Darau</h1>
          <h2>Kementerian Pendidikan Malaysia</h2>
          <p>89200 Kota Belud, Sabah</p>
        </div>
        <div class="no-ref">Ruj: SKD/ASET/${new Date(p.tarikh_pinjam).getFullYear()}/${String(Math.floor(Math.random()*9000)+1000)}</div>
        <div class="tajuk"><h3>Borang Pinjaman Aset Sekolah</h3></div>
        <p class="section-title">A. MAKLUMAT PEMINJAM</p>
        <table class="info">
          <tr><td>Nama Peminjam</td><td>:</td><td>${p.nama_peminjam}</td></tr>
          <tr><td>Jawatan</td><td>:</td><td>${p.jawatan || '—'}</td></tr>
          <tr><td>Tarikh Pinjam</td><td>:</td><td>${tarikh}</td></tr>
          <tr><td>Masa Pinjam</td><td>:</td><td>${masa}</td></tr>
        </table>
        <p class="section-title">B. MAKLUMAT ASET</p>
        <table class="info">
          <tr><td>Nama Aset</td><td>:</td><td>${p.aset?.nama || '—'}</td></tr>
          <tr><td>No. Siri / No. Aset</td><td>:</td><td>${p.aset?.no_siri || '—'}</td></tr>
          <tr><td>Kategori</td><td>:</td><td>${p.aset?.kategori || '—'}</td></tr>
          <tr><td>Lokasi Asal</td><td>:</td><td>${p.aset?.lokasi || '—'}</td></tr>
        </table>
        <p class="section-title">C. AKUAN PEMINJAM</p>
        <div class="akuan">
          Saya yang bertandatangan di bawah ini dengan ini mengaku bahawa saya telah meminjam aset tersebut di atas dan bersetuju untuk:
          <ol style="margin: 10px 0 0 20px; line-height: 2;">
            <li>Menjaga aset yang dipinjam dengan baik dan bertanggungjawab ke atasnya.</li>
            <li>Mengembalikan aset dalam keadaan baik seperti semasa dipinjam.</li>
            <li>Melaporkan sebarang kerosakan atau kehilangan kepada Guru Aset dengan segera.</li>
            <li>Bertanggungjawab ke atas sebarang kerosakan akibat kecuaian semasa dalam jagaan saya.</li>
          </ol>
        </div>
        <div class="tandatangan">
          <div class="ttd-box">
            <div class="ttd-line"></div>
            <div class="ttd-label">Tandatangan Peminjam</div>
            <div class="ttd-name">${p.nama_peminjam}</div>
            <div class="ttd-jawatan">${p.jawatan || ''}</div>
            <div class="ttd-jawatan" style="margin-top:4px">Tarikh: _______________</div>
          </div>
          <div class="ttd-box">
            <div class="ttd-line"></div>
            <div class="ttd-label">Disahkan Oleh</div>
            <div class="ttd-name">Khairul Azwani bin Haji Ahinin</div>
            <div class="ttd-jawatan">Guru Aset</div>
            <div class="ttd-jawatan">Sekolah Kebangsaan Darau</div>
            <div class="ttd-jawatan" style="margin-top:4px">Tarikh: _______________</div>
          </div>
        </div>
        <div class="footer">
          Borang ini dijana secara automatik oleh Sistem Pengurusan Aset SK Darau &nbsp;|&nbsp; ${new Date().toLocaleDateString('ms-MY')}
        </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
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

  const pinjamanAsetIds = new Set(pinjamanList.map(p => p.aset_id))

  const stats = {
    jumlah:     asetList.length,
    aktif:      asetList.filter(a => a.status === 'aktif').length,
    rosak:      asetList.filter(a => a.status === 'rosak').length,
    baik_pulih: asetList.filter(a => a.status === 'baik_pulih').length,
  }

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

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const tarikh = new Date().toLocaleDateString('ms-MY')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('SENARAI ASET ALIH KERAJAAN (KEW.PA-7)', 148, 15, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Sekolah Kebangsaan Darau', 148, 22, { align: 'center' })
    doc.text(`Tarikh Cetak: ${tarikh}`, 148, 28, { align: 'center' })
    autoTable(doc, {
      startY: 34,
      head: [['Bil.', 'No. Aset', 'Nama Aset', 'Kategori', 'Lokasi', 'Status', 'Tarikh Terima', 'Harga (RM)']],
      body: filtered.map((a, i) => [
        i + 1, a.no_siri, a.nama, a.kategori || '-', a.lokasi || '-',
        STATUS_CONFIG[a.status]?.label || a.status,
        a.tarikh_terima ? new Date(a.tarikh_terima).toLocaleDateString('ms-MY') : '-',
        a.harga ? `RM ${Number(a.harga).toFixed(2)}` : '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 234, 255] },
    })
    doc.setFontSize(8)
    doc.text(`Guru Aset: Khairul Azwani bin Haji Ahinin`, 14, doc.lastAutoTable.finalY + 10)
    doc.text(`Jumlah Rekod: ${filtered.length}`, 14, doc.lastAutoTable.finalY + 16)
    doc.save(`KEW_PA7_SK_Darau_${new Date().toISOString().slice(0,10)}.pdf`)
    toast.success('PDF dimuat turun')
  }

  function printSenarai() {
    const tarikh = new Date().toLocaleDateString('ms-MY')
    const rows = filtered.map((a, i) => `
      <tr>
        <td>${i + 1}</td><td><code>${a.no_siri}</code></td><td>${a.nama}</td>
        <td>${a.kategori || '-'}</td><td>${a.lokasi || '-'}</td>
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
        th { background: #6d28d9; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 5px 8px; }
        tr:nth-child(even) td { background: #f5f3ff; }
        code { font-family: monospace; font-size: 10px; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; }
        @media print { body { margin: 10px; } }
      </style></head>
      <body>
        <h2>SENARAI ASET ALIH — SEKOLAH KEBANGSAAN DARAU</h2>
        <p class="sub">Tarikh Cetak: ${tarikh} &nbsp;|&nbsp; Jumlah: ${filtered.length} rekod</p>
        <table>
          <thead><tr><th>Bil.</th><th>No. Aset</th><th>Nama Aset</th><th>Kategori</th>
            <th>Lokasi</th><th>Status</th><th>Tarikh Terima</th><th>Harga</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Guru Aset: Khairul Azwani bin Haji Ahinin</p>
          <p>Tandatangan: _____________________________ &nbsp;&nbsp; Tarikh: ______________</p>
        </div>
      </body></html>`)
    win.document.close(); win.focus(); win.print(); win.close()
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="min-h-screen relative">

      {/* ── Fixed decorative background ── */}
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #0d0020 0%, #1a0535 45%, #0f0e4e 100%)' }}>
        <div className="blob absolute top-[-80px] left-[15%] w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="blob blob-2 absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #e11d48, transparent 70%)' }} />
        <div className="blob blob-3 absolute top-[40%] left-[-5%] w-64 h-64 rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Floating chibi stars in bg */}
        <span className="absolute top-[20%] right-[8%] text-yellow-300 star-2 pointer-events-none select-none" style={{ fontSize: 22, opacity: 0.4 }}>✦</span>
        <span className="absolute top-[60%] left-[5%] text-pink-300 star-4 pointer-events-none select-none" style={{ fontSize: 18, opacity: 0.35 }}>✦</span>
        <span className="absolute top-[80%] right-[20%] text-purple-300 star-1 pointer-events-none select-none" style={{ fontSize: 14, opacity: 0.3 }}>✦</span>
      </div>

      {/* ── Header ── */}
      <header className="safe-top sticky top-0 z-40"
        style={{ background: 'rgba(13,0,32,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">

          {/* School logo with glow */}
          <div className="relative shrink-0 chibi-wiggle" style={{ animationDuration: '3s' }}>
            <div className="absolute inset-0 rounded-full blur-md opacity-60"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }} />
            <img src="https://i.postimg.cc/pdhvk3Q2/images.jpg" alt="Logo SK Darau"
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2"
              style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
          </div>

          {/* School name */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-purple-300">
              Kementerian Pendidikan Malaysia
            </p>
            <h1 className="text-base md:text-xl font-bold text-white leading-tight truncate flex items-center gap-1.5"
              style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Sekolah Kebangsaan Darau
              <span className="text-yellow-300 star-1 hidden sm:inline" style={{ fontSize: 14 }}>✦</span>
            </h1>
            <p className="text-[10px] md:text-xs text-purple-300/70 hidden sm:block">Sistem Pengurusan Aset Sekolah</p>
          </div>

          {/* Chibi mascot — desktop only */}
          <div className="hidden lg:block chibi-float shrink-0" style={{ marginTop: '-8px' }}>
            <ChibiMascot className="w-16 h-16" />
          </div>

          {/* Guru badge */}
          <div className="hidden md:flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }}>
              <UserCheck size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-purple-300">Guru Aset</p>
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>Khairul Azwani</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'dashboard' ? 'text-white shadow-lg shadow-purple-500/30' : 'text-purple-300/70 hover:text-white hover:bg-white/8'
              }`}
              style={activeTab === 'dashboard' ? { background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', fontFamily: 'Fredoka, sans-serif', fontSize: '15px' } : { fontFamily: 'Fredoka, sans-serif', fontSize: '15px' }}>
              <LayoutDashboard size={15} />
              📦 Dashboard
            </button>
            <button onClick={() => setActiveTab('pinjaman')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'pinjaman' ? 'text-white shadow-lg shadow-rose-500/30' : 'text-purple-300/70 hover:text-white hover:bg-white/8'
              }`}
              style={activeTab === 'pinjaman' ? { background: 'linear-gradient(135deg, #be123c, #f43f5e)', fontFamily: 'Fredoka, sans-serif', fontSize: '15px' } : { fontFamily: 'Fredoka, sans-serif', fontSize: '15px' }}>
              <LogIn size={15} />
              🔑 Pinjaman
              {pinjamanList.length > 0 && (
                <span className="chibi-bounce text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: 'rgba(244,63,94,0.9)', color: 'white', display: 'inline-block' }}>
                  {pinjamanList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5 safe-bottom">

        {/* ── Bento Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Big card: Total Aset */}
          <div className="col-span-2 lg:col-span-2 lg:row-span-2 chibi-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(109,40,217,0.4) 0%, rgba(124,58,237,0.3) 50%, rgba(225,29,72,0.2) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(139,92,246,0.3)',
              minHeight: '180px',
            }}>
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #f43f5e, transparent)' }} />
            {/* Twinkling stars */}
            <Stars />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', boxShadow: '0 8px 20px rgba(109,40,217,0.4)' }}>
                    <Package size={22} className="text-white" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)', fontFamily: 'Fredoka, sans-serif' }}>
                    ✨ Semua Aset
                  </span>
                </div>
                <p className="text-7xl font-bold text-white leading-none"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {stats.jumlah}
                </p>
                <p className="text-purple-200 font-bold mt-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Jumlah Aset Didaftarkan
                </p>
              </div>
              {/* Chibi mascot inside big card */}
              <div className="chibi-float shrink-0 hidden sm:block" style={{ marginTop: '-4px' }}>
                <ChibiMascot className="w-20 h-20 opacity-90" />
              </div>
            </div>

            <div className="relative mt-4 pt-4 flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-purple-300/70" style={{ fontFamily: 'Nunito, sans-serif' }}>Sistem aktif · SK Darau 🌟</p>
            </div>
          </div>

          {/* Aktif */}
          <ChibiStatCard
            emoji="🌟"
            icon={<CheckCircle size={18} className="text-white" />}
            iconGradient="linear-gradient(135deg, #059669, #10b981)"
            iconShadow="0 6px 16px rgba(5,150,105,0.35)"
            value={stats.aktif}
            label="Aset Aktif"
            bgAccent="rgba(16,185,129,0.12)"
          />

          {/* Rosak */}
          <ChibiStatCard
            emoji="😢"
            icon={<XCircle size={18} className="text-white" />}
            iconGradient="linear-gradient(135deg, #be123c, #f43f5e)"
            iconShadow="0 6px 16px rgba(190,18,60,0.35)"
            value={stats.rosak}
            label="Aset Rosak"
            bgAccent="rgba(244,63,94,0.1)"
          />

          {/* Baik Pulih: wide card */}
          <div className="col-span-2 lg:col-span-2 chibi-card rounded-3xl p-5 flex items-center gap-5 relative overflow-hidden cursor-default"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
            <span className="absolute top-2 right-3 star-3" style={{ fontSize: 16, color: '#fbbf24', opacity: 0.6 }}>✦</span>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', boxShadow: '0 6px 16px rgba(180,83,9,0.35)' }}>
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {stats.baik_pulih}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">🔧 Dalam Baik Pulih</p>
            </div>
            <div className="ml-auto flex items-end gap-1 opacity-60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-2 rounded-full transition-all"
                  style={{
                    height: `${14 + i * 5}px`,
                    background: i < Math.min(stats.baik_pulih, 5) ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Log Pinjaman Tab ── */}
        {activeTab === 'pinjaman' && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between px-5 md:px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  🔑 Aset Sedang Dipinjam
                </h2>
                <p className="text-xs text-slate-400">{pinjamanList.length} aset belum dipulangkan</p>
              </div>
              <button onClick={fetchPinjaman}
                className="text-xs text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-xl hover:bg-white/8 transition font-bold"
                style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px' }}>
                ↻ Muat Semula
              </button>
            </div>

            {loadingPinjaman ? (
              <ChibiLoading />
            ) : pinjamanList.length === 0 ? (
              <ChibiEmpty
                emoji="🎉"
                title="Tiada aset sedang dipinjam!"
                sub="Semua aset ada di tempat masing-masing ✦"
                color="emerald"
              />
            ) : (
              <div>
                {pinjamanList.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 md:px-6 py-4 hover:bg-white/4 transition"
                    style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    {p.aset?.gambar_url ? (
                      <img src={p.aset.gambar_url} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        <Package size={18} className="text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{p.aset?.nama || '—'}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="font-mono text-xs text-slate-500">{p.aset?.no_siri}</span>
                        {p.aset?.lokasi && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={10} /> {p.aset.lokasi}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:block text-right min-w-36">
                      <div className="flex items-center justify-end gap-1.5">
                        <User size={12} className="text-amber-400" />
                        <p className="text-sm font-bold text-amber-300">{p.nama_peminjam}</p>
                      </div>
                      {p.jawatan && <p className="text-xs text-slate-500">{p.jawatan}</p>}
                      <div className="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500">
                        <Clock size={10} />
                        {new Date(p.tarikh_pinjam).toLocaleString('ms-MY')}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <GlassBtn onClick={() => janaSuratPinjaman(p)} color="text-purple-300 hover:bg-purple-500/15">
                        <FileText size={13} /> <span className="hidden sm:inline">Jana Surat</span>
                      </GlassBtn>
                      <GlassBtn onClick={() => handleTandaPulang(p)} color="text-amber-300 hover:bg-amber-500/15">
                        <LogOut size={13} /> <span className="hidden sm:inline">Pulangkan</span>
                      </GlassBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-slate-600">SK Darau · Sistem Pengurusan Aset ✦</p>
            </div>
          </div>
        )}

        {/* ── Dashboard: Senarai Aset ── */}
        {activeTab === 'dashboard' && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 md:px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  📦 Senarai Aset
                </h2>
                <p className="text-xs text-slate-400">{filtered.length} rekod dijumpai ✦</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-2xl px-3 py-2 min-w-48 flex-1 md:flex-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Search size={14} className="text-slate-500 shrink-0" />
                  <input type="text" placeholder="Cari nama, no. siri, lokasi..."
                    value={carian} onChange={e => setCarian(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-white" />
                </div>
                <div className="relative">
                  <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
                    className="appearance-none rounded-2xl pl-3 pr-8 py-2 text-sm text-white outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Semua Kategori</option>
                    {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="appearance-none rounded-2xl pl-3 pr-8 py-2 text-sm text-white outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Semua Status</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                </div>
                <GlassBtn onClick={() => setShowImport(true)} color="text-purple-300 hover:bg-purple-500/15">
                  <FileSpreadsheet size={15} /> Import
                </GlassBtn>
                <GlassBtn onClick={printSenarai} color="text-slate-300 hover:bg-white/10">
                  <Printer size={15} /> Print
                </GlassBtn>
                <GlassBtn onClick={exportExcel} color="text-emerald-300 hover:bg-emerald-500/15">
                  <FileSpreadsheet size={15} /> Excel
                </GlassBtn>
                <GlassBtn onClick={exportPDF} color="text-rose-300 hover:bg-rose-500/15">
                  <FileDown size={15} /> PDF
                </GlassBtn>
                <button onClick={() => { setEditAset(null); setShowForm(true) }}
                  className="flex items-center gap-2 px-4 py-2 font-bold text-white rounded-2xl transition shadow-lg hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                    boxShadow: '0 4px 15px rgba(109,40,217,0.4)',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '15px',
                  }}>
                  <Plus size={16} /> Tambah Aset ✦
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <ChibiLoading />
            ) : filtered.length === 0 ? (
              <ChibiEmpty
                emoji="🔍"
                title={carian || filterKategori || filterStatus ? 'Tiada rekod dijumpai~' : 'Belum ada aset didaftarkan~'}
                sub="Cuba tambah aset baru atau ubah carian ✦"
                color="purple"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['No. Aset','Aset','Kategori','Lokasi','Status','Tindakan'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                          style={{ fontFamily: 'Fredoka, sans-serif' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((aset) => (
                      <tr key={aset.id}
                        className="group hover:bg-white/4 transition-colors"
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          background: pinjamanAsetIds.has(aset.id) ? 'rgba(245,158,11,0.04)' : undefined,
                        }}>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs px-2 py-1 rounded-xl text-purple-300"
                            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                            {aset.no_siri}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {aset.gambar_url ? (
                              <img src={aset.gambar_url} alt="" className="w-10 h-10 rounded-2xl object-cover shrink-0"
                                style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
                            ) : (
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                <Package size={17} className="text-purple-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-white">{aset.nama}</p>
                              {(aset.jenama || aset.model) && (
                                <p className="text-xs text-slate-500">{[aset.jenama, aset.model].filter(Boolean).join(' · ')}</p>
                              )}
                              {pinjamanAsetIds.has(aset.id) && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>
                                  <LogIn size={10} /> Sedang Dipinjam
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {aset.kategori
                            ? <span className="text-xs px-2.5 py-1 rounded-xl font-bold text-violet-300"
                                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.18)' }}>
                                {aset.kategori}
                              </span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-sm">{aset.lokasi || <span className="text-slate-600">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[aset.status]?.color || 'bg-gray-400/20 text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[aset.status]?.dot}`} />
                            {STATUS_CONFIG[aset.status]?.label || aset.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <ActionBtn title="QR / Dokumen"    hover="hover:bg-purple-500/20 hover:text-purple-300" icon={<Eye size={14} />}            onClick={() => setQrAset(aset)} />
                            <ActionBtn title="Penyelenggaraan" hover="hover:bg-amber-500/20 hover:text-amber-300"   icon={<Wrench size={14} />}          onClick={() => setPenyelenggaraanAset(aset)} />
                            <ActionBtn title="Perpindahan"     hover="hover:bg-violet-500/20 hover:text-violet-300" icon={<ArrowRightLeft size={14} />}  onClick={() => setPerpindahanAset(aset)} />
                            <ActionBtn title="Edit"            hover="hover:bg-white/10 hover:text-white"           icon={<Pencil size={14} />}          onClick={() => { setEditAset(aset); setShowForm(true) }} />
                            <ActionBtn title="Padam"           hover="hover:bg-rose-500/20 hover:text-rose-300"     icon={<Trash2 size={14} />}          onClick={() => handleDelete(aset.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-slate-600">SK Darau · Sistem Pengurusan Aset ✦</p>
              <p className="text-xs text-slate-600">Guru Aset: Khairul Azwani bin Haji Ahinin</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && <AsetForm aset={editAset} onSuccess={handleFormSuccess} onClose={() => { setShowForm(false); setEditAset(null) }} />}
      {qrAset && <QRModal aset={qrAset} onClose={() => setQrAset(null)} />}
      {penyelenggaraanAset && <PenyelenggaraanModal aset={penyelenggaraanAset} onClose={() => setPenyelenggaraanAset(null)} />}
      {perpindahanAset && <PerpindahanModal aset={perpindahanAset} onClose={() => setPerpindahanAset(null)} onPindah={fetchAset} />}
      {showImport && <BulkImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); fetchAset() }} />}
    </div>
  )
}

/* ─── Chibi stat card ─── */
function ChibiStatCard({ emoji, icon, iconGradient, iconShadow, value, label, bgAccent }) {
  return (
    <div className="col-span-1 chibi-card rounded-3xl p-5 relative overflow-hidden cursor-default"
      style={{
        background: bgAccent ? `linear-gradient(135deg, ${bgAccent}, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
      <span className="absolute top-2 right-3 star-2 text-yellow-200" style={{ fontSize: 12, opacity: 0.6 }}>✦</span>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: iconGradient, boxShadow: iconShadow }}>
        {icon}
      </div>
      <p className="text-4xl font-bold text-white leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{emoji} {label}</p>
    </div>
  )
}

/* ─── Glass button ─── */
function GlassBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-2xl transition hover:scale-105 active:scale-95 ${color}`}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Nunito, sans-serif' }}>
      {children}
    </button>
  )
}

/* ─── Action button ─── */
function ActionBtn({ title, hover, icon, onClick }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-xl text-slate-500 transition hover:scale-110 ${hover}`}>
      {icon}
    </button>
  )
}

/* ─── Chibi loading ─── */
function ChibiLoading() {
  return (
    <div className="py-16 text-center">
      <div className="flex justify-center gap-2 mb-4">
        <span className="bounce-dot-1 w-3 h-3 rounded-full inline-block" style={{ background: '#8b5cf6' }} />
        <span className="bounce-dot-2 w-3 h-3 rounded-full inline-block" style={{ background: '#f43f5e' }} />
        <span className="bounce-dot-3 w-3 h-3 rounded-full inline-block" style={{ background: '#f9a8d4' }} />
      </div>
      <p className="text-slate-400 text-sm" style={{ fontFamily: 'Fredoka, sans-serif' }}>Memuatkan... ✦</p>
    </div>
  )
}

/* ─── Chibi empty state ─── */
function ChibiEmpty({ emoji, title, sub, color }) {
  const colors = {
    purple: { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.15)' },
    emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.15)' },
  }
  const c = colors[color] || colors.purple
  return (
    <div className="py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full flex items-center justify-center chibi-bounce"
          style={{ background: c.bg, border: `1px solid ${c.border}`, fontSize: 36 }}>
          {emoji}
        </div>
        <p className="text-slate-200 font-bold text-base" style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </div>
  )
}
