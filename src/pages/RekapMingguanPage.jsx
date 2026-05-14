import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { KELAS_LIST } from '../utils/constants';
import { getWeekRange, getDatesInRange, getDayName, formatDateShort } from '../utils/dateUtils';
import { exportToExcel } from '../utils/exportExcel';
import { Download } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RekapMingguanPage() {
  const { siswaList, getAbsensiRange } = useData();
  const week = getWeekRange();
  const [startDate, setStartDate] = useState(week.start);
  const [endDate, setEndDate] = useState(week.end);
  const [filterKelas, setFilterKelas] = useState('');

  const dates = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);
  const absensiRange = useMemo(() => getAbsensiRange(startDate, endDate), [startDate, endDate, getAbsensiRange]);

  const filteredSiswa = filterKelas ? siswaList.filter((s) => s.kelas === filterKelas) : siswaList;

  const rekapData = useMemo(() => {
    return filteredSiswa.map((siswa) => {
      const row = { nama: siswa.nama, nis: siswa.nis, kelas: siswa.kelas, days: {}, hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      dates.forEach((d) => {
        const rec = absensiRange.find((a) => a.siswaId === siswa.id && a.tanggal === d);
        const st = rec ? rec.status : '-';
        row.days[d] = st;
        if (st === 'Hadir') row.hadir++;
        else if (st === 'Izin') row.izin++;
        else if (st === 'Sakit') row.sakit++;
        else if (st === 'Alpha') row.alpha++;
      });
      return row;
    });
  }, [filteredSiswa, dates, absensiRange]);

  const statusChar = (s) => s === 'Hadir' ? 'H' : s === 'Izin' ? 'I' : s === 'Sakit' ? 'S' : s === 'Alpha' ? 'A' : '-';
  const statusBadge = (s) => s === 'Hadir' ? 'badge-hadir' : s === 'Izin' ? 'badge-izin' : s === 'Sakit' ? 'badge-sakit' : s === 'Alpha' ? 'badge-alpha' : '';

  const totals = useMemo(() => {
    return { hadir: rekapData.reduce((s, r) => s + r.hadir, 0), izin: rekapData.reduce((s, r) => s + r.izin, 0), sakit: rekapData.reduce((s, r) => s + r.sakit, 0), alpha: rekapData.reduce((s, r) => s + r.alpha, 0) };
  }, [rekapData]);

  const chartData = {
    labels: dates.map((d) => getDayName(d).substring(0, 3)),
    datasets: [
      { label: 'Hadir', data: dates.map((d) => absensiRange.filter((a) => a.tanggal === d && a.status === 'Hadir').length), backgroundColor: 'rgba(39,174,96,0.8)', borderRadius: 4 },
      { label: 'Izin', data: dates.map((d) => absensiRange.filter((a) => a.tanggal === d && a.status === 'Izin').length), backgroundColor: 'rgba(52,152,219,0.8)', borderRadius: 4 },
      { label: 'Sakit', data: dates.map((d) => absensiRange.filter((a) => a.tanggal === d && a.status === 'Sakit').length), backgroundColor: 'rgba(243,156,18,0.8)', borderRadius: 4 },
      { label: 'Alpha', data: dates.map((d) => absensiRange.filter((a) => a.tanggal === d && a.status === 'Alpha').length), backgroundColor: 'rgba(231,76,60,0.8)', borderRadius: 4 },
    ],
  };

  const handleExport = () => {
    const data = rekapData.map((r) => {
      const row = { Nama: r.nama, NIS: r.nis, Kelas: r.kelas };
      dates.forEach((d) => { row[formatDateShort(d)] = statusChar(r.days[d]); });
      row['Hadir'] = r.hadir; row['Izin'] = r.izin; row['Sakit'] = r.sakit; row['Alpha'] = r.alpha;
      return row;
    });
    exportToExcel(data, `Rekap_Mingguan_${startDate}_${endDate}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>Rekap Mingguan</h1><p>Ringkasan kehadiran per minggu</p></div>
      <div className="filter-row">
        <div className="form-group"><label className="form-label">Dari</label><input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Sampai</label><input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
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

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Grafik Kehadiran</h3></div>
        <div className="card-body"><div style={{ height: 250 }}><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter' } } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } } } }} /></div></div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Tabel Rekap</h3><div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-hadir">H: {totals.hadir}</span>
          <span className="badge badge-izin">I: {totals.izin}</span>
          <span className="badge badge-sakit">S: {totals.sakit}</span>
          <span className="badge badge-alpha">A: {totals.alpha}</span>
        </div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Kelas</th>{dates.map((d) => <th key={d} style={{ textAlign: 'center' }}>{getDayName(d).substring(0, 3)}<br /><small>{formatDateShort(d)}</small></th>)}<th>H</th><th>I</th><th>S</th><th>A</th></tr></thead>
              <tbody>
                {rekapData.map((r) => (
                  <tr key={r.nis}>
                    <td style={{ fontWeight: 500 }}>{r.nama}</td>
                    <td>{r.kelas}</td>
                    {dates.map((d) => <td key={d} style={{ textAlign: 'center' }}>{r.days[d] !== '-' ? <span className={`badge ${statusBadge(r.days[d])}`} style={{ minWidth: 28 }}>{statusChar(r.days[d])}</span> : '-'}</td>)}
                    <td className="text-success font-semibold">{r.hadir}</td>
                    <td className="text-primary font-semibold">{r.izin}</td>
                    <td className="text-warning font-semibold">{r.sakit}</td>
                    <td className="text-danger font-semibold">{r.alpha}</td>
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
