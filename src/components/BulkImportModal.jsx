import { useState, useRef } from 'react'
import { supabase, generateNoAset } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { X, Upload, Download, CheckCircle, XCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'

const TEMPLATE_HEADERS = [
  'nama', 'kategori', 'jenama', 'model', 'no_siri_pembuat',
  'pembekal', 'no_kontrak', 'cara_diperoleh', 'tarikh_terima',
  'tarikh_penempatan', 'tarikh_waranti_tamat', 'harga', 'nilai_semasa',
  'lokasi', 'pegawai_bertanggungjawab', 'ketua_jabatan', 'status', 'spesifikasi',
]

const TEMPLATE_EXAMPLE = [{
  nama: 'Laptop Dell Latitude 5520',
  kategori: 'ICT',
  jenama: 'Dell',
  model: 'Latitude 5520',
  no_siri_pembuat: 'SN1234567890',
  pembekal: 'Syarikat ABC Sdn Bhd',
  no_kontrak: 'KPM-ICT-2024-001',
  cara_diperoleh: 'Beli',
  tarikh_terima: '2024-01-15',
  tarikh_penempatan: '2024-01-20',
  tarikh_waranti_tamat: '2027-01-15',
  harga: '4500.00',
  nilai_semasa: '4000.00',
  lokasi: 'Bilik Komputer 1',
  pegawai_bertanggungjawab: 'Ahmad bin Ali',
  ketua_jabatan: 'GPK HEM',
  status: 'aktif',
  spesifikasi: 'Intel Core i5-11th Gen, 8GB RAM, 256GB SSD',
}]

export default function BulkImportModal({ onClose, onDone }) {
  const fileRef = useRef()
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLE, { header: TEMPLATE_HEADERS })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Template_Import_Aset_SK_Darau.xlsx')
    toast.success('Template dimuat turun')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
      setRows(data)
      setResults(null)
    }
    reader.readAsBinaryString(file)
  }

  async function handleImport() {
    if (!rows.length) { toast.error('Tiada data'); return }
    setImporting(true)

    const ok = [], fail = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const no_siri = generateNoAset(r.kategori || 'Lain-lain')
      const payload = {
        no_siri,
        nama:                     r.nama || `Aset ${i + 1}`,
        kategori:                 r.kategori || null,
        jenama:                   r.jenama || null,
        model:                    r.model || null,
        no_siri_pembuat:          r.no_siri_pembuat || null,
        pembekal:                 r.pembekal || null,
        no_kontrak:               r.no_kontrak || null,
        cara_diperoleh:           r.cara_diperoleh || 'Beli',
        tarikh_terima:            r.tarikh_terima || null,
        tarikh_penempatan:        r.tarikh_penempatan || null,
        tarikh_waranti_tamat:     r.tarikh_waranti_tamat || null,
        harga:                    r.harga ? Number(r.harga) : null,
        nilai_semasa:             r.nilai_semasa ? Number(r.nilai_semasa) : null,
        lokasi:                   r.lokasi || null,
        pegawai_bertanggungjawab: r.pegawai_bertanggungjawab || null,
        ketua_jabatan:            r.ketua_jabatan || null,
        status:                   r.status || 'aktif',
        spesifikasi:              r.spesifikasi || null,
      }

      const { error } = await supabase.from('aset').insert(payload)
      if (error) fail.push({ baris: i + 2, nama: r.nama, sebab: error.message })
      else ok.push(r.nama)
    }

    setResults({ ok, fail })
    setImporting(false)

    if (ok.length) {
      toast.success(`${ok.length} aset berjaya diimport`)
      onDone()
    }
    if (fail.length) toast.error(`${fail.length} rekod gagal`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-500" />
              Import Aset (Bulk)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Muat naik fail Excel untuk import berbilang aset sekaligus</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Step 1: Template */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Langkah 1 — Muat Turun Template</p>
            <p className="text-xs text-blue-600 mb-3">Isi data dalam template Excel, jangan tukar nama header.</p>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <Download size={14} />
              Muat Turun Template Excel
            </button>
          </div>

          {/* Step 2: Upload */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Langkah 2 — Muat Naik Fail yang Dah Diisi</p>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition">
              <Upload size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Klik untuk pilih fail Excel / CSV</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>

          {/* Preview */}
          {rows.length > 0 && !results && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">{rows.length} rekod dijumpai — Preview 3 pertama:</p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="text-xs w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500">Nama</th>
                      <th className="px-3 py-2 text-left text-slate-500">Kategori</th>
                      <th className="px-3 py-2 text-left text-slate-500">Lokasi</th>
                      <th className="px-3 py-2 text-left text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 3).map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-700">{r.nama || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{r.kategori || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{r.lokasi || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{r.status || 'aktif'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleImport} disabled={importing}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                {importing ? <><Loader2 size={15} className="animate-spin" />Mengimport {rows.length} rekod...</> : `Import ${rows.length} Aset`}
              </button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {results.ok.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle size={16} />{results.ok.length} aset berjaya diimport
                  </p>
                </div>
              )}
              {results.fail.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-2">
                    <XCircle size={16} />{results.fail.length} rekod gagal
                  </p>
                  <div className="space-y-1">
                    {results.fail.map((f, i) => (
                      <p key={i} className="text-xs text-red-600">Baris {f.baris}: {f.nama} — {f.sebab}</p>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={onClose}
                className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
