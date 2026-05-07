import { useState } from 'react';
import { useData } from '../context/DataContext';
import { KELAS_LIST, STATUS_LIST } from '../utils/constants';
import { getTodayStr } from '../utils/dateUtils';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function RiwayatAbsensiPage() {
  const { siswaList, absensiList, addAbsensi, updateAbsensiStatus } = useData();
  const { addToast } = useToast();
  const [tanggal, setTanggal] = useState(getTodayStr());
  const [filterKelas, setFilterKelas] = useState('Kelas 1'); // Default to Kelas 1
  const [search, setSearch] = useState('');

  // Get attendance records for the selected date
  const absensiOnDate = absensiList.filter((a) => a.tanggal === tanggal);

  // Map all students to their attendance status for the selected date
  const mappedData = siswaList
    .filter((s) => !filterKelas || s.kelas === filterKelas)
    .filter((s) => !search || s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search))
    .map((s) => {
      const absensi = absensiOnDate.find((a) => a.siswa_id === s.id || a.siswaId === s.id);
      return {
        ...s,
        absensiId: absensi ? absensi.id : null,
        status: absensi ? absensi.status : 'Belum Absen',
        jamMasuk: absensi ? absensi.jamMasuk : null,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama)); // Sort by name

  const handleStatusChange = async (siswa, newStatus) => {
    try {
      if (siswa.absensiId) {
        // If already exists, update it
        if (newStatus === 'Belum Absen') {
          addToast('Tidak bisa mengubah kembali menjadi Belum Absen. Harap hubungi admin jika perlu dihapus.', 'error');
          return;
        }
        await updateAbsensiStatus(siswa.absensiId, newStatus);
        addToast(`Status ${siswa.nama} diubah menjadi ${newStatus}`, 'success');
      } else {
        // If doesn't exist, create it
        if (newStatus !== 'Belum Absen') {
          await addAbsensi(siswa.id, newStatus, tanggal);
          addToast(`${siswa.nama} berhasil ditandai ${newStatus}`, 'success');
        }
      }
    } catch (error) {
      addToast('Gagal mengubah status', 'error');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Hadir': return { background: 'var(--success-light)', color: 'var(--success)' };
      case 'Izin': return { background: 'var(--info-light)', color: 'var(--info)' };
      case 'Sakit': return { background: 'var(--warning-light)', color: 'var(--warning)' };
      case 'Alpha': return { background: 'var(--danger-light)', color: 'var(--danger)' };
      default: return { background: '#f1f5f9', color: '#64748b' }; // Belum Absen (Gray)
    }
  };

  const sudahAbsenCount = mappedData.filter(s => s.status !== 'Belum Absen').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Daftar Absensi Harian</h1>
        <p>Pantau kehadiran seluruh siswa per kelas pada hari tertentu</p>
      </div>

      <div className="filter-row">
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input type="date" className="form-input" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {KELAS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Cari</label>
          <div className="search-bar">
            <Search size={18} />
            <input className="form-input" placeholder="Cari nama / NIS..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <h3>Data Kehadiran</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-izin">Total: {mappedData.length}</span>
            <span className="badge badge-hadir">Sudah Absen: {sudahAbsenCount}</span>
            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Belum: {mappedData.length - sudahAbsenCount}</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>NIS</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th>Jam Masuk</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: s.status === 'Belum Absen' ? '#fdfdfd' : 'transparent' }}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      {s.nama}
                      {s.status === 'Belum Absen' && (
                        <AlertCircle size={14} color="#cbd5e1" style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
                      )}
                    </td>
                    <td>{s.nis}</td>
                    <td>{s.kelas}</td>
                    <td>
                      <select
                        className="status-select"
                        value={s.status}
                        onChange={(e) => handleStatusChange(s, e.target.value)}
                        style={getStatusStyle(s.status)}
                      >
                        <option value="Belum Absen" disabled>Belum Absen</option>
                        {STATUS_LIST.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td style={{ color: s.jamMasuk ? 'inherit' : 'var(--text-light)' }}>
                      {s.jamMasuk || '-'}
                    </td>
                  </tr>
                ))}
                {mappedData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center" style={{ padding: 32, color: 'var(--text-light)' }}>
                      Tidak ada data siswa ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
