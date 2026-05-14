import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { KELAS_LIST } from '../utils/constants';
import { getMonthRange, getMonthName } from '../utils/dateUtils';
import { exportToExcel } from '../utils/exportExcel';
import { Download } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RekapBulananPage() {
  const { siswaList, getAbsensiRange } = useData();
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const firstDay = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
  const lastDay = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [filterKelas, setFilterKelas] = useState('');

  const range = useMemo(() => ({ start: startDate, end: endDate }), [startDate, endDate]);
  const absensiRange = useMemo(() => getAbsensiRange(range.start, range.end), [range, getAbsensiRange]);
  const filteredSiswa = filterKelas ? siswaList.filter((s) => s.kelas === filterKelas) : siswaList;

  // Count school days in range (exclude Sundays)
  const schoolDays = useMemo(() => {
    if (!range.start || !range.end) return 0;
    let count = 0;
    const d = new Date(range.start);
    const end = new Date(range.end);
    while (d <= end) { if (d.getDay() !== 0) count++; d.setDate(d.getDate() + 1); }
    return count;
  }, [range]);

  const rekapData = useMemo(() => {
    return filteredSiswa.map((siswa) => {
      const records = absensiRange.filter((a) => a.siswaId === siswa.id || a.siswa_id === siswa.id);
      const hadir = records.filter((a) => a.status === 'Hadir').length;
      const izin = records.filter((a) => a.status === 'Izin').length;
      const sakit = records.filter((a) => a.status === 'Sakit').length;
      const alpha = records.filter((a) => a.status === 'Alpha').length;
      const persen = schoolDays > 0 ? Math.round((hadir / schoolDays) * 100) : 0;
      return { nama: siswa.nama, nis: siswa.nis, kelas: siswa.kelas, hadir, izin, sakit, alpha, total: records.length, schoolDays, persen };
    });
  }, [filteredSiswa, absensiRange, schoolDays]);

  const totals = useMemo(() => ({
    hadir: rekapData.reduce((s, r) => s + r.hadir, 0),
    izin: rekapData.reduce((s, r) => s + r.izin, 0),
    sakit: rekapData.reduce((s, r) => s + r.sakit, 0),
    alpha: rekapData.reduce((s, r) => s + r.alpha, 0),
  }), [rekapData]);

  const pieData = {
    labels: ['Hadir', 'Izin', 'Sakit', 'Alpha'],
    datasets: [{
      data: [totals.hadir, totals.izin, totals.sakit, totals.alpha],
      backgroundColor: ['rgba(39,174,96,0.85)', 'rgba(52,152,219,0.85)', 'rgba(243,156,18,0.85)', 'rgba(231,76,60,0.85)'],
      borderWidth: 2, borderColor: '#fff',
    }],
  };

  const getPersenColor = (p) => p >= 80 ? 'green' : p >= 60 ? 'orange' : 'red';

  const handleExport = () => {
    const data = rekapData.map((r) => ({
      Nama: r.nama, NIS: r.nis, Kelas: r.kelas, Hadir: r.hadir, Izin: r.izin,
      Sakit: r.sakit, Alpha: r.alpha, 'Hari Sekolah': r.schoolDays, 'Kehadiran (%)': r.persen + '%',
    }));
    exportToExcel(data, `Rekap_Kehadiran_${startDate}_sd_${endDate}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>Rekap Bulanan</h1><p>Ringkasan kehadiran berdasarkan rentang waktu</p></div>
      <div className="filter-row">
        <div className="form-group"><label className="form-label">Dari Tanggal</label>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Sampai Tanggal</label>
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Kelas</label>
          <select className="form-select" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {KELAS_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-group">
          <button className="btn btn-success" onClick={handleExport} style={{ width: '100%' }}><Download size={16} /> Export Excel</button>
        </div>
      </div>

      <div className="rekap-bulanan-grid">
        <div className="stat-cards-grid" style={{ alignContent: 'start' }}>
          <div className="stat-card green"><div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>H</div><div className="stat-card-info"><h4>Total Hadir</h4><div className="stat-value">{totals.hadir}</div></div></div>
          <div className="stat-card blue"><div className="stat-card-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>I</div><div className="stat-card-info"><h4>Total Izin</h4><div className="stat-value">{totals.izin}</div></div></div>
          <div className="stat-card orange"><div className="stat-card-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>S</div><div className="stat-card-info"><h4>Total Sakit</h4><div className="stat-value">{totals.sakit}</div></div></div>
          <div className="stat-card red"><div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>A</div><div className="stat-card-info"><h4>Total Alpha</h4><div className="stat-value">{totals.alpha}</div></div></div>
        </div>
        <div className="card"><div className="card-header"><h3>Distribusi</h3></div><div className="card-body"><Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter' } } } } }} /></div></div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Detail Rekap — {startDate} s/d {endDate}</h3><span className="badge badge-izin">{schoolDays} hari sekolah</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Kelas</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Kehadiran</th></tr></thead>
              <tbody>
                {rekapData.map((r) => (
                  <tr key={r.nis}>
                    <td style={{ fontWeight: 500 }}>{r.nama}</td>
                    <td>{r.kelas}</td>
                    <td className="text-success font-semibold">{r.hadir}</td>
                    <td className="text-primary font-semibold">{r.izin}</td>
                    <td className="text-warning font-semibold">{r.sakit}</td>
                    <td className="text-danger font-semibold">{r.alpha}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}><div className={`progress-bar-fill ${getPersenColor(r.persen)}`} style={{ width: `${r.persen}%` }} /></div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 40 }}>{r.persen}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
