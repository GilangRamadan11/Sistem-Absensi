import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, XCircle, ScanLine, Clock } from 'lucide-react';
import { formatDate, getTodayStr } from '../utils/dateUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { getTodayStats, absensiList, siswaList } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = getTodayStats();

  // Last 7 school days chart data
  const last7Days = [];
  const d = new Date();
  while (last7Days.length < 7) {
    if (d.getDay() !== 0) {
      last7Days.unshift(d.toISOString().split('T')[0]);
    }
    d.setDate(d.getDate() - 1);
  }

  const chartData = {
    labels: last7Days.map((date) => {
      const dt = new Date(date);
      return dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Hadir',
        data: last7Days.map(
          (date) => absensiList.filter((a) => a.tanggal === date && a.status === 'Hadir').length
        ),
        backgroundColor: 'rgba(39, 174, 96, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Tidak Hadir',
        data: last7Days.map((date) => {
          const absenHariIni = absensiList.filter((a) => a.tanggal === date);
          return absenHariIni.filter((a) => a.status !== 'Hadir').length;
        }),
        backgroundColor: 'rgba(231, 76, 60, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { family: 'Inter' } } },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter' } } },
    },
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.nama}! — {formatDate(getTodayStr())}</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-card-icon"><Users size={24} /></div>
          <div className="stat-card-info">
            <h4>Total Siswa</h4>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon"><CheckCircle size={24} /></div>
          <div className="stat-card-info">
            <h4>Hadir Hari Ini</h4>
            <div className="stat-value">{stats.hadir}</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon"><XCircle size={24} /></div>
          <div className="stat-card-info">
            <h4>Tidak Hadir</h4>
            <div className="stat-value">{stats.tidakHadir}</div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <button
        className="btn btn-primary btn-lg"
        style={{ marginBottom: 24, width: '100%', maxWidth: 400 }}
        onClick={() => navigate('/scan')}
      >
        <ScanLine size={22} />
        Mulai Scan Absensi
      </button>

      {/* Chart + Recent Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ gridColumn: window.innerWidth < 768 ? '1 / -1' : undefined }}>
          <div className="card-header">
            <h3>Kehadiran 7 Hari Terakhir</h3>
          </div>
          <div className="card-body">
            <div style={{ height: 260 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: window.innerWidth < 768 ? '1 / -1' : undefined }}>
          <div className="card-header">
            <h3>Absensi Hari Ini</h3>
            <span className="badge badge-hadir">{stats.absensiHariIni.length} tercatat</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.absensiHariIni.length > 0 ? (
              <div className="table-wrapper" style={{ border: 'none', maxHeight: 260, overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Kelas</th>
                      <th>Status</th>
                      <th>Jam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.absensiHariIni.slice(0, 8).map((a) => (
                      <tr key={a.id}>
                        <td>{a.nama}</td>
                        <td>{a.kelas}</td>
                        <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                        <td>
                          {a.jamMasuk && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                              <Clock size={14} /> {a.jamMasuk}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <p>Belum ada absensi hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
