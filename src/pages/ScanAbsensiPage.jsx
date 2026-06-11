import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { getTodayStr } from '../utils/dateUtils';
import { ScanLine, Camera, CameraOff, Clock, User } from 'lucide-react';

export default function ScanAbsensiPage() {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const scannerRef = useRef(null);
  const { addAbsensi, getSiswaByNis, absensiList } = useData();
  const { addToast } = useToast();
  const todayAbsensi = absensiList.filter((a) => a.tanggal === getTodayStr());
  const [manualNis, setManualNis] = useState('');

  const startScan = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScanResult(decodedText),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      addToast('Gagal mengakses kamera. Pastikan izin kamera diberikan.', 'error');
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (nis) => {
    const siswa = getSiswaByNis(nis);
    if (!siswa) {
      addToast('QR Code tidak dikenali!', 'error');
      setLastResult({ error: true });
      return;
    }
    const result = await addAbsensi(siswa.id, 'Hadir');
    if (result.success) {
      addToast(`Absensi berhasil — ${siswa.nama} (${siswa.kelas})`, 'success');
      setLastResult({ error: false, siswa, isNew: true });
    } else {
      addToast('Sudah absen hari ini!', 'warning');
      setLastResult({ error: false, siswa, isNew: false });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualNis.trim()) { await handleScanResult(manualNis.trim()); setManualNis(''); }
  };

  useEffect(() => { return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); }; }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Scan Absensi</h1>
        <p>Pindai QR Code siswa untuk mencatat kehadiran</p>
      </div>
      <div className="scan-layout">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="scanner-viewport" style={{ width: '100%', maxWidth: 360, aspectRatio: '1', marginBottom: 16, position: 'relative' }}>
                <div id="qr-reader" style={{ width: '100%', height: '100%' }} />
                {scanning && <div className="scan-line" />}
                {!scanning && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', gap: 8 }}>
                    <Camera size={48} /><span style={{ fontSize: '0.85rem' }}>Tekan tombol untuk mulai scan</span>
                  </div>
                )}
              </div>
              <button className={`btn ${scanning ? 'btn-danger' : 'btn-primary'} btn-lg`} style={{ width: '100%', maxWidth: 360 }} onClick={scanning ? stopScan : startScan}>
                {scanning ? <><CameraOff size={20} /> Stop Scan</> : <><ScanLine size={20} /> Mulai Scan</>}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Input Absensi Manual </h3></div>
            <div className="card-body">
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="Ketik NIS..." value={manualNis} onChange={(e) => setManualNis(e.target.value)} />
                <button type="submit" className="btn btn-primary">Scan</button>
              </form>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>Contoh: 20240001 s/d 20240024</p>
            </div>
          </div>
          {lastResult && !lastResult.error && (
            <div className={`scan-result-card ${lastResult.isNew ? '' : 'warning'}`} style={{ marginTop: 16 }}>
              <div className="scan-result-avatar">{lastResult.siswa.nama.charAt(0)}</div>
              <div className="scan-result-info">
                <h4>{lastResult.siswa.nama}</h4>
                <p>{lastResult.siswa.kelas} • NIS: {lastResult.siswa.nis}</p>
                <span className={`badge ${lastResult.isNew ? 'badge-hadir' : 'badge-sakit'}`}>{lastResult.isNew ? '✅ Hadir' : '⚠️ Sudah Absen'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><h3>Sudah Absen Hari Ini</h3><span className="badge badge-hadir">{todayAbsensi.length} siswa</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayAbsensi.length > 0 ? (
              <div className="table-wrapper" style={{ border: 'none', maxHeight: 500, overflow: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Jam</th></tr></thead>
                  <tbody>
                    {todayAbsensi.map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td>{a.nama}</td>
                        <td>{a.kelas}</td>
                        <td>{a.jamMasuk && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {a.jamMasuk}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><User size={48} /><h3>Belum ada absensi</h3><p>Mulai scan QR Code siswa</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
