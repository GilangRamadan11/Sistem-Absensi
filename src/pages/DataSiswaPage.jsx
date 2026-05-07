import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { KELAS_LIST } from '../utils/constants';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, Edit2, Trash2, QrCode, X, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const TAHUN_AJARAN_LIST = ['2024/2025', '2025/2026'];

export default function DataSiswaPage() {
  const { siswaList, addSiswa, updateSiswa, deleteSiswa, uploadSiswaBulk } = useData();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('2024/2025'); // Default filter

  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [editData, setEditData] = useState(null);

  const [form, setForm] = useState({ nama: '', nis: '', kelas: 'Kelas 1', tahun_ajaran: '2024/2025' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [importForm, setImportForm] = useState({ file: null, kelas: 'Kelas 1', tahun_ajaran: '2024/2025' });

  const filtered = siswaList.filter((s) => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchTahun = filterTahunAjaran === 'Semua Tahun' || !s.tahun_ajaran || s.tahun_ajaran === filterTahunAjaran;
    return matchSearch && matchKelas && matchTahun;
  });

  const openAdd = () => { setEditData(null); setForm({ nama: '', nis: '', kelas: 'Kelas 1', tahun_ajaran: filterTahunAjaran !== 'Semua Tahun' ? filterTahunAjaran : '2024/2025' }); setShowModal(true); };
  const openEdit = (s) => { setEditData(s); setForm({ nama: s.nama, nis: s.nis, kelas: s.kelas, tahun_ajaran: s.tahun_ajaran || '2024/2025' }); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.nis.trim()) { addToast('Nama dan NIS harus diisi!', 'error'); return; }
    if (editData) {
      updateSiswa(editData.id, form);
      addToast('Data siswa berhasil diperbarui!', 'success');
    } else {
      addSiswa(form);
      addToast('Siswa berhasil ditambahkan!', 'success');
    }
    setShowModal(false);
  };

  const handleDeleteClick = (s) => {
    setDeleteConfirm(s);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteSiswa(deleteConfirm.id);
      addToast('Data siswa dihapus', 'warning');
      setDeleteConfirm(null);
    }
  };

  const downloadQR = (siswa) => {
    const svg = document.getElementById(`qr-${siswa.nis}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);
      const a = document.createElement('a');
      a.download = `QR_${siswa.nis}_${siswa.nama}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ Nama: 'Contoh Nama Siswa', NIS: '20241234' }]);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importForm.file) {
      addToast('Pilih file Excel terlebih dahulu!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          addToast('File Excel kosong!', 'error');
          return;
        }

        const validData = [];
        let errors = 0;

        data.forEach(row => {
          // Check for exact column names (case-insensitive mapping handled manually if needed, but let's assume exact match for simplicity)
          const nama = row.Nama || row.nama;
          const nis = row.NIS || row.nis;

          if (nama && nis) {
            validData.push({
              nama: String(nama),
              nis: String(nis),
              kelas: importForm.kelas,
              tahun_ajaran: importForm.tahun_ajaran
            });
          } else {
            errors++;
          }
        });

        if (validData.length === 0) {
          addToast('Format salah! Pastikan kolom Nama dan NIS tersedia.', 'error');
          return;
        }

        await uploadSiswaBulk(validData);
        if (errors > 0) {
          addToast(`${validData.length} data diproses. ${errors} baris dilewati karena format tidak sesuai.`, 'warning');
        }

        setShowImport(false);
        setImportForm({ file: null, kelas: 'Kelas 1', tahun_ajaran: '2024/2025' });
      } catch (err) {
        addToast('Gagal memproses file. Pastikan formatnya .xlsx', 'error');
      }
    };
    reader.readAsBinaryString(importForm.file);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>Data Siswa</h1><p>Kelola data siswa dan QR Code</p></div>
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        <div className="toolbar-left" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <label className="form-label">Tahun Ajaran</label>
            <select className="form-select" style={{ width: 140 }} value={filterTahunAjaran} onChange={(e) => setFilterTahunAjaran(e.target.value)}>
              <option value="Semua Tahun">Semua Tahun</option>
              {TAHUN_AJARAN_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Kelas</label>
            <select className="form-select" style={{ width: 140 }} value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
              <option value="">Semua Kelas</option>
              {KELAS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Cari</label>
            <div className="search-bar"><Search size={18} /><input className="form-input" placeholder="Cari nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>

        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-success" onClick={() => setShowImport(true)}><FileSpreadsheet size={18} /> Import Excel</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Siswa</button>
        </div>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>QR Code</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.nama}</td>
                    <td>{s.nis}</td>
                    <td><span className="badge badge-izin">{s.kelas}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => setShowQR(s)}><QrCode size={16} /> Lihat</button></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)} title="Edit"><Edit2 size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteClick(s)} title="Hapus" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="6" className="text-center" style={{ padding: 32, color: 'var(--text-light)' }}>Tidak ada data pada tahun ajaran ini</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editData ? 'Edit Siswa' : 'Tambah Siswa'}</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Nama Lengkap</label><input className="form-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama siswa" /></div>
                <div className="form-group"><label className="form-label">NIS</label><input className="form-input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} placeholder="Nomor Induk Siswa" /></div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Kelas</label>
                    <select className="form-select" value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })}>{KELAS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                  </div>
                  <div>
                    <label className="form-label">Tahun Ajaran</label>
                    <select className="form-select" value={form.tahun_ajaran} onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })}>{TAHUN_AJARAN_LIST.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">{editData ? 'Simpan' : 'Tambah'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Data Siswa</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowImport(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--info-light)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <strong style={{ color: 'var(--info)' }}>Panduan:</strong>
                  <ul style={{ paddingLeft: 16, marginTop: 4, color: 'var(--text-secondary)' }}>
                    <li>Pastikan file memiliki header kolom <b>Nama</b> dan <b>NIS</b></li>
                    <li>Siswa dengan NIS yang sudah terdaftar akan otomatis diperbarui.</li>
                    <li>Pilih Kelas dan Tahun Ajaran untuk seluruh siswa dalam file ini.</li>
                  </ul>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }} onClick={downloadTemplate}>
                    <Download size={14} /> Download Template Excel
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih File (.xlsx, .xls)</label>
                  <input type="file" accept=".xlsx, .xls" className="form-input" style={{ padding: '8px' }} onChange={(e) => setImportForm({ ...importForm, file: e.target.files[0] })} />
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Terapkan ke Kelas</label>
                    <select className="form-select" value={importForm.kelas} onChange={(e) => setImportForm({ ...importForm, kelas: e.target.value })}>
                      {KELAS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Tahun Ajaran</label>
                    <select className="form-select" value={importForm.tahun_ajaran} onChange={(e) => setImportForm({ ...importForm, tahun_ajaran: e.target.value })}>
                      {TAHUN_AJARAN_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowImport(false)}>Batal</button>
                <button type="submit" className="btn btn-success" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Upload size={16} /> Mulai Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header"><h3>QR Code</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowQR(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="qr-display">
                <QRCodeSVG id={`qr-${showQR.nis}`} value={showQR.nis} size={200} level="H" />
                <h4>{showQR.nama}</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{showQR.kelas} • NIS: {showQR.nis}</p>
                <button className="btn btn-primary" onClick={() => downloadQR(showQR)}><Download size={16} /> Download QR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Konfirmasi Hapus</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus data <strong>{deleteConfirm.nama}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: 8 }}>
                Peringatan: Seluruh data absensi untuk siswa ini juga akan ikut terhapus.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Ya, Hapus Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
