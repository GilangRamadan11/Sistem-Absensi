import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { KELAS_LIST } from '../utils/constants';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, Edit2, Trash2, QrCode, X, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const TAHUN_AJARAN_LIST = [
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031'
];

export default function DataSiswaPage() {
  const { siswaList, addSiswa, updateSiswa, deleteSiswa, uploadSiswaBulk } = useData();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('2025/2026'); // Default filter

  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [editData, setEditData] = useState(null);

  const [form, setForm] = useState({ nama: '', nis: '', kelas: '1A', tahun_ajaran: '2025/2026' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [importForm, setImportForm] = useState({ file: null, kelas: '1A', tahun_ajaran: '2025/2026' });

  const filtered = siswaList.filter((s) => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchTahun = filterTahunAjaran === 'Semua Tahun' || !s.tahun_ajaran || s.tahun_ajaran === filterTahunAjaran;
    return matchSearch && matchKelas && matchTahun;
  });

  const openAdd = () => { setEditData(null); setForm({ nama: '', nis: '', kelas: '1A', tahun_ajaran: filterTahunAjaran !== 'Semua Tahun' ? filterTahunAjaran : '2025/2026' }); setShowModal(true); };
  const openEdit = (s) => { setEditData(s); setForm({ nama: s.nama, nis: s.nis, kelas: s.kelas, tahun_ajaran: s.tahun_ajaran || '2025/2026' }); setShowModal(true); };

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
    
    const cardWidth = 400;
    const cardHeight = 560;
    const scale = 2; // High-res for print
    const canvas = document.createElement('canvas');
    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // --- Background ---
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, cardHeight, 16);
    ctx.fill();

    // --- Header gradient bar ---
    const headerH = 90;
    const grad = ctx.createLinearGradient(0, 0, cardWidth, 0);
    grad.addColorStop(0, '#1E3A5F');
    grad.addColorStop(1, '#4A90D9');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, headerH, [16, 16, 0, 0]);
    ctx.fill();

    // --- School name ---
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KARTU IDENTITAS SISWA', cardWidth / 2, 32);
    ctx.font = '700 17px Inter, sans-serif';
    ctx.fillText('SDN 128 Haurpancuh', cardWidth / 2, 56);
    ctx.font = '400 11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Sistem Absensi Digital', cardWidth / 2, 76);

    // --- QR Code area ---
    const qrSize = 200;
    const qrX = (cardWidth - qrSize) / 2;
    const qrY = headerH + 30;

    // QR frame with subtle shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // QR border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
    ctx.stroke();

    // --- Info section ---
    const infoY = qrY + qrSize + 40;

    // Divider line
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, infoY - 16);
    ctx.lineTo(cardWidth - 40, infoY - 16);
    ctx.stroke();

    // Student name
    ctx.fillStyle = '#2C3E50';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(siswa.nama, cardWidth / 2, infoY + 6);

    // NIS
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillText(`NIS: ${siswa.nis}`, cardWidth / 2, infoY + 30);

    // Class badge
    const badgeText = `Kelas ${siswa.kelas}`;
    ctx.font = '600 13px Inter, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 28;
    const badgeX = (cardWidth - badgeWidth) / 2;
    const badgeY = infoY + 44;
    ctx.fillStyle = '#EBF3FB';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#4A90D9';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, cardWidth / 2, badgeY + 19);

    // --- Footer ---
    const footerY = cardHeight - 32;
    ctx.fillStyle = '#BDC3C7';
    ctx.font = '400 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Tahun Ajaran ${siswa.tahun_ajaran || '2025/2026'}`, cardWidth / 2, footerY);

    // --- Draw QR code onto canvas ---
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      const a = document.createElement('a');
      a.download = `Kartu_QR_${siswa.nis}_${siswa.nama}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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
        setImportForm({ file: null, kelas: '1A', tahun_ajaran: '2025/2026' });
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
            <select className="form-select" value={filterTahunAjaran} onChange={(e) => setFilterTahunAjaran(e.target.value)}>
              <option value="Semua Tahun">Semua Tahun</option>
              {TAHUN_AJARAN_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Kelas</label>
            <select className="form-select" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
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
                <div className="form-group modal-form-grid">
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

                <div className="form-group modal-form-grid">
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

      {/* Modal QR Code - Card Preview */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h3>Kartu QR Siswa</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowQR(null)}><X size={18} /></button></div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="qr-card-preview">
                <div className="qr-card">
                  <div className="qr-card-header">
                    <span className="qr-card-subtitle">KARTU IDENTITAS SISWA</span>
                    <span className="qr-card-school">SDN 128 Haurpancuh</span>
                    <span className="qr-card-tagline">Sistem Absensi Digital</span>
                  </div>
                  <div className="qr-card-body">
                    <div className="qr-card-qr-frame">
                      <QRCodeSVG id={`qr-${showQR.nis}`} value={showQR.nis} size={180} level="H" />
                    </div>
                    <div className="qr-card-info">
                      <h4 className="qr-card-name">{showQR.nama}</h4>
                      <p className="qr-card-nis">NIS: {showQR.nis}</p>
                      <span className="qr-card-kelas">Kelas {showQR.kelas}</span>
                    </div>
                  </div>
                  <div className="qr-card-footer">
                    Tahun Ajaran {showQR.tahun_ajaran || '2025/2026'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => downloadQR(showQR)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Download size={16} /> Download Kartu QR
              </button>
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
